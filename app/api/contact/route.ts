import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { contactNotificationEmail, contactConfirmationEmail } from "@/lib/emailTemplates";
import {
    EMAIL_REGEX,
    fieldsOverLimit,
    isDisposableEmail,
    containsProfanity,
    looksLikeBot,
    rateLimit,
    getClientIp,
} from "@/lib/security";
import type { ContactRequest, ContactResponse } from "@/types/contact";

// Resend's shared test sender - swap for a verified-domain address once the practice's
// domain is verified in the Resend dashboard.
const FROM_EMAIL = "Hayes Hip and Elbow Scoring <noreply@mail.hayes-hip-and-elbow-scoring.com>";
const NOTIFICATION_RECIPIENT = process.env.CONTACT_NOTIFICATION_RECIPIENT!;

/**
 * Sends the contact form to the practice inbox and a confirmation back to the submitter.
 *
 * @remarks
 * Abuse checks run before any send, cheapest / highest-signal first:
 * 1. Bot heuristics (honeypot + fill time) - fail *silently* with a fake success so
 *    the trap isn't obvious to whoever wrote the script.
 * 2. Rate limit per client IP - `429` so a legitimate double-submit gets a clear signal.
 * 3. Shape + length validation - `400`.
 * 4. Disposable-email block - `400`; we can't reply to a throwaway address.
 * 5. Profanity - never blocks, only flags the staff notification (false positives,
 *    and an upset customer shouldn't be silenced).
 *
 * The two emails are sent in parallel via `Promise.allSettled` since they're
 * independent. The Resend SDK resolves `{ data, error }` rather than throwing on
 * API-level failures, so each result's `error` field is checked explicitly. A failed
 * notification fails the whole request - the submitter shouldn't see success if the
 * practice never got their message. A failed confirmation doesn't - the practice still
 * received the lead - it's only logged.
 */
export async function POST(req: Request) {
    try {
        const body: ContactRequest = await req.json();
        const { name, email, message, company, elapsedMs } = body;

        // 1. Bot heuristics - silent fake success, nothing sent.
        if (looksLikeBot({ honeypot: company, elapsedMs })) {
            console.warn("Contact form: bot-like submission rejected", {
                honeypotFilled: typeof company === "string" && company.trim().length > 0,
                elapsedMs,
            });
            return NextResponse.json({ success: true } satisfies ContactResponse);
        }

        // 2. Rate limit.
        const { ok, retryAfterMs } = rateLimit(getClientIp(req));
        if (!ok) {
            return NextResponse.json(
                { error: "Too many messages - please wait a minute and try again." },
                { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
            );
        }

        // 3. Shape + length.
        const errors: string[] = [];
        if (!name?.trim()) errors.push("Please enter your name.");
        if (!email?.trim() || !EMAIL_REGEX.test(email.trim())) errors.push("Please enter a valid email address.");
        if (!message?.trim()) errors.push("Please enter a message.");

        if (errors.length === 0 && fieldsOverLimit({ name, email, message }).length > 0) {
            errors.push("One of your fields is too long - please shorten it.");
        }

        if (errors.length > 0) {
            return NextResponse.json({ errors }, { status: 400 });
        }

        // 4. Disposable email - we'd never be able to reply.
        if (isDisposableEmail(email)) {
            return NextResponse.json(
                { errors: ["Please use a permanent email address so we can reply to you."] },
                { status: 400 },
            );
        }

        // 5. Profanity - flag, don't block.
        const flagged = containsProfanity(`${name} ${message}`);

        const [notificationResult, confirmationResult] = await Promise.allSettled([
            resend.emails.send({
                from: FROM_EMAIL,
                to: NOTIFICATION_RECIPIENT,
                replyTo: email,
                ...contactNotificationEmail({ name, email, message, flagged }),
            }),
            resend.emails.send({
                from: FROM_EMAIL,
                to: email,
                replyTo: NOTIFICATION_RECIPIENT,
                ...contactConfirmationEmail({ name }),
            }),
        ]);

        const notificationFailed = notificationResult.status === "rejected" || !!notificationResult.value.error;
        if (notificationFailed) {
            console.error("Contact notification email failed: ", notificationResult);
            return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
        }

        const confirmationFailed = confirmationResult.status === "rejected" || !!confirmationResult.value.error;
        if (confirmationFailed) {
            console.error("Contact confirmation email failed: ", confirmationResult);
        }

        const response: ContactResponse = { success: true };
        return NextResponse.json(response);

    } catch (error) {
        console.error("Contact error: ", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 },
        );
    }
}
