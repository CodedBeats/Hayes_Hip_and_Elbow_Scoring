import { stripe } from "@/lib/stripe";
import { markSubmissionsPaid } from "@/lib/payments";
import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect fast-path for payment confirmation - called by `/success` right after Stripe
 * bounces the customer back.
 *
 * @remarks
 * The browser can only *trigger* this, not dictate the outcome: the session is retrieved
 * from Stripe by ID and the submission IDs come from that session's own metadata, never
 * the request. A hostile caller with a guessed session ID just gets someone else's
 * session.
 *
 * This exists purely for speed - the webhook (`/api/webhooks/stripe`) is the guarantee.
 * So a write failure here is logged and swallowed: we still report `paid: true` so the
 * user sees success, and the webhook reconciles the record.
 */
export async function GET(req: NextRequest) {
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
        return NextResponse.json({ paid: false }, { status: 400 });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // "no_payment_required" is Stripe's status for a session fully covered by a discount
        // (e.g. the admin-test 100%-off coupon in /api/create-checkout-session) - no card was
        // charged, but the session completed successfully, same as "paid".
        const paid =
            session.payment_status === "paid" ||
            session.payment_status === "no_payment_required";

        const isAdminTest = session.metadata?.adminTest === "true";
        const submissionIds = (session.metadata?.submissionIds ?? "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        if (paid && submissionIds.length > 0) {
            try {
                const paymentIntentId =
                    typeof session.payment_intent === "string" ? session.payment_intent : null;
                await markSubmissionsPaid(
                    submissionIds,
                    isAdminTest ? "test" : "paid",
                    paymentIntentId,
                );
            } catch (err) {
                console.error("[verify-payment] failed to mark submissions paid:", submissionIds, err);
            }
        }

        return NextResponse.json({ paid, isAdminTest, submissionIds });
    } catch (err) {
        console.error("[verify-payment] could not verify session:", sessionId, err);
        return NextResponse.json({ paid: false, error: "Could not verify payment" }, { status: 502 });
    }
}
