import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { contactNotificationEmail, contactConfirmationEmail } from "@/lib/emailTemplates";
import type { ContactRequest, ContactResponse } from "@/types/contact";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Resend's shared test sender - swap for a verified-domain address once the practice's
// domain is verified in the Resend dashboard.
const FROM_EMAIL = "Hayes Hip and Elbow Scoring <noreply@mail.hayes-hip-and-elbow-scoring.com>";
const NOTIFICATION_RECIPIENT = process.env.CONTACT_NOTIFICATION_RECIPIENT!;

/**
 * Sends the contact form to the practice inbox and a confirmation back to the submitter.
 *
 * @remarks
 * The two emails are sent in parallel via `Promise.allSettled` since they're
 * independent (different recipients/content, no ordering dependency). The Resend SDK
 * resolves `{ data, error }` rather than throwing on API-level failures (bad recipient,
 * sandbox restrictions, etc.), so each result's `error` field is checked explicitly.
 * A failed notification fails the whole request - the submitter shouldn't see success if
 * the practice never got their message. A failed confirmation doesn't - the practice
 * still received the lead, which is what matters - it's only logged.
 */
export async function POST(req: Request) {
    try {
        const body: ContactRequest = await req.json();
        const { name, email, message } = body;

        const errors: string[] = [];
        if (!name?.trim()) errors.push("Please enter your name.");
        if (!email?.trim() || !EMAIL_REGEX.test(email.trim())) errors.push("Please enter a valid email address.");
        if (!message?.trim()) errors.push("Please enter a message.");

        if (errors.length > 0) {
            return NextResponse.json({ errors }, { status: 400 });
        }

        const [notificationResult, confirmationResult] = await Promise.allSettled([
            resend.emails.send({
                from: FROM_EMAIL,
                to: NOTIFICATION_RECIPIENT,
                replyTo: email,
                ...contactNotificationEmail({ name, email, message }),
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
