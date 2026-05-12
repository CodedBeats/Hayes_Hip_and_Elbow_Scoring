import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
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

                        unit_amount: 15000, // $150 AUD
                    },

                    quantity: 1,
                },
            ],

            success_url:
                "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",

            cancel_url: "http://localhost:3000/cancel",
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
