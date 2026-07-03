import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const { amount } = await req.json() as { amount: number };

    try {
        const session = await stripe.checkout.sessions.create({
            mode: "payment",

            payment_method_types: ["card"],

            line_items: [
                {
                    price_data: {
                        currency: "aud",

                        product_data: {
                            name: "Hip/Elbow Submission",
                        },

                        unit_amount: amount,
                    },

                    quantity: 1,
                },
            ],

            success_url:
                "https://www.hayes-hip-and-elbow-scoring.com/success?session_id={CHECKOUT_SESSION_ID}",

            cancel_url: "http://www.hayes-hip-and-elbow-scoring.com/cancel",
        });

        return NextResponse.json({
            url: session.url,
        });
    } catch (err) {
        console.error(err);

        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 },
        );
    }
}
