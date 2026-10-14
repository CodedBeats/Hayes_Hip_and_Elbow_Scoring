import Stripe from "stripe";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { markSubmissionsPaid } from "@/lib/payments";

// Signature verification uses Node's crypto via stripe.webhooks.constructEvent - the Edge
// runtime doesn't provide it. This is also the first route in the app to opt out of Edge.
export const runtime = "nodejs";

/**
 * Stripe webhook - the guaranteed, trustworthy half of payment confirmation.
 *
 * @remarks
 * Stripe retries any non-2xx for ~3 days, so this is what makes the payment record
 * correct even when the customer's browser never reaches `/success`. The redirect path
 * (`/api/verify-payment`) is the fast feedback; this is the backstop. Both write via
 * `markSubmissionsPaid` and are idempotent.
 *
 * The signature check is the whole point: without it this URL is a public endpoint where
 * anyone who guesses the path could POST a fake `checkout.session.completed`. It must run
 * against the *raw* request bytes - `req.json()` re-serialises and breaks the HMAC, so we
 * read `req.text()`.
 */
export async function POST(req: Request) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !secret) {
        console.error("[webhooks/stripe] missing stripe-signature header or STRIPE_WEBHOOK_SECRET");
        return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
        console.error("[webhooks/stripe] signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 200 (not 400) for event types we don't handle, so Stripe treats them as delivered
    // and doesn't retry.
    if (event.type !== "checkout.session.completed") {
        return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // "no_payment_required" = fully covered by a discount (the admin-test 100%-off coupon).
    const paid =
        session.payment_status === "paid" || session.payment_status === "no_payment_required";
    if (!paid) {
        // e.g. an async payment method still pending - nothing to record yet.
        return NextResponse.json({ received: true });
    }

    const submissionIds = (session.metadata?.submissionIds ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    if (submissionIds.length === 0) {
        console.error(
            "[webhooks/stripe] checkout.session.completed with no submissionIds metadata:",
            session.id,
        );
        return NextResponse.json({ received: true });
    }

    const status = session.metadata?.adminTest === "true" ? "test" : "paid";
    const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;

    try {
        await markSubmissionsPaid(submissionIds, status, paymentIntentId);
    } catch (err) {
        // Non-2xx so Stripe retries - a transient Firestore error will usually clear, and a
        // persistent one is worth the stuck-webhook alert.
        console.error("[webhooks/stripe] failed to mark submissions paid:", submissionIds, err);
        return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
