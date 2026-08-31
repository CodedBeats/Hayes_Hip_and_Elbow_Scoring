import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
        return NextResponse.json({ paid: false }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // "no_payment_required" is Stripe's status for a session fully covered by a discount
    // (e.g. the admin-test 100%-off coupon in /api/create-checkout-session) - no card was
    // charged, but the session completed successfully, same as "paid".
    return NextResponse.json({
        paid: session.payment_status === "paid" || session.payment_status === "no_payment_required",
    });
}
