import { stripe } from "@/lib/stripe";
import { calculatePrice, EXAM_LABELS } from "@/lib/pricing";
import { verifyAdminToken } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ExamType } from "@/types/form";

type CheckoutItem = {
    dogName: string;
    examType: ExamType;
    isDogsAustraliaRegistered: boolean;
};

export async function POST(req: NextRequest) {
    const { items, submissionIds, adminTest, adminIdToken } = await req.json() as {
        items: CheckoutItem[];
        submissionIds: string[];
        adminTest?: boolean;
        adminIdToken?: string;
    };

    if (!items?.length || !submissionIds?.length) {
        return NextResponse.json({ error: "Missing items or submissionIds" }, { status: 400 });
    }

    // Admin test checkouts still hit real Stripe (so the redirect/verify path gets
    // exercised too) but must be gated by a real server-verified auth token - a
    // client-side "is signed in" check only hides the button, it doesn't stop someone
    // from POSTing here directly.
    if (adminTest) {
        if (!adminIdToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        try {
            await verifyAdminToken(adminIdToken);
        } catch {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    // Prices are always derived here from lib/pricing.ts, never taken from the client -
    // otherwise anyone could POST an arbitrary amount for a real (non-admin-test) checkout.
    const priced = items.map((item) => ({
        ...item,
        ...calculatePrice(item.examType, item.isDogsAustraliaRegistered),
    }));

    // Real prices throughout, admin-test included - the test flow no longer fudges
    // per-item amounts to hit a minimum charge, since the 100%-off coupon below brings
    // the real total to $0 instead.
    const line_items = priced.map((item) => ({
        price_data: {
            currency: "aud",
            product_data: { name: `${EXAM_LABELS[item.examType]} - ${item.dogName}` },
            unit_amount: Math.round(item.total * 100),
        },
        quantity: 1,
    }));

    try {
        // A fresh, single-use 100%-off coupon rather than a stored/shared one - created
        // per admin-test session so there's no coupon ID to leak or reuse, and
        // max_redemptions: 1 means it self-invalidates the moment it's applied.
        const discounts = adminTest
            ? [{
                coupon: (await stripe.coupons.create({
                    percent_off: 100,
                    duration: "once",
                    max_redemptions: 1,
                    name: "Admin Test Submission - 100% Off",
                })).id,
            }]
            : undefined;

        const session = await stripe.checkout.sessions.create({
            mode: "payment",

            payment_method_types: ["card"],
            submit_type: "pay",
            phone_number_collection: { enabled: true },
            custom_text: {
                submit: {
                    message: "Your radiographs will be reviewed by our specialist scoring team.",
                },
            },

            line_items,
            discounts,

            metadata: {
                submissionIds: submissionIds.join(","),
                adminTest: adminTest ? "true" : "false",
            },

            success_url: `${req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.nextUrl.origin}/cancel`,
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
