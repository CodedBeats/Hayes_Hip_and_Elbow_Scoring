import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { calculatePrice, EXAM_LABELS } from "@/lib/pricing";
import { verifyAdminToken } from "@/lib/firebaseAdmin";
import { rateLimit, getClientIp } from "@/lib/security";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ExamType } from "@/types/form";

type CheckoutItem = {
    dogName: string;
    examType: ExamType;
    isDogsAustraliaRegistered: boolean;
};

// Defensive ceilings, not real UX limits - there's no existing cap on dog count or name
// length upstream in the submission form, so these just stop a hostile/malformed request
// from producing an absurd Stripe payload rather than reflecting an actual product limit.
const MAX_ITEMS = 20;
const MAX_DOG_NAME_LENGTH = 200;

const VALID_EXAM_TYPES = new Set(Object.keys(EXAM_LABELS));

export async function POST(req: NextRequest) {
    // This endpoint is public and unauthenticated for normal (non-admin-test) checkouts -
    // rate limit by IP before doing any real work, same pattern as /api/contact. A real
    // 429 rather than a silent fail: unlike a honeypot trap, a legitimate double-clicking
    // user needs to see what happened.
    const { ok, retryAfterMs } = rateLimit(`checkout:${getClientIp(req)}`, 10, 60_000);
    if (!ok) {
        return NextResponse.json(
            { error: "Too many requests - please wait a minute and try again." },
            { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
        );
    }

    let body: {
        items: CheckoutItem[];
        submissionIds: string[];
        adminTest?: boolean;
        adminIdToken?: string;
    };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Malformed request body" }, { status: 400 });
    }
    const { items, submissionIds, adminTest, adminIdToken } = body;

    if (!items?.length || !submissionIds?.length) {
        return NextResponse.json({ error: "Missing items or submissionIds" }, { status: 400 });
    }

    if (items.length !== submissionIds.length) {
        return NextResponse.json({ error: "items and submissionIds must be the same length" }, { status: 400 });
    }

    if (items.length > MAX_ITEMS) {
        return NextResponse.json({ error: "Too many items" }, { status: 400 });
    }

    for (const item of items) {
        if (!VALID_EXAM_TYPES.has(item.examType)) {
            return NextResponse.json({ error: "Invalid exam type" }, { status: 400 });
        }
        if (!item.dogName?.trim() || item.dogName.length > MAX_DOG_NAME_LENGTH) {
            return NextResponse.json({ error: "Invalid dog name" }, { status: 400 });
        }
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
        // Derived from the sorted submissionIds so a double-click (or a retried request)
        // reuses the same Stripe objects instead of creating duplicates. Namespaced per
        // call - Stripe idempotency keys are a single namespace per API key, not per
        // endpoint, so reusing one raw key across two different calls would just return
        // the first call's cached response instead of running the second. Note keys expire
        // after ~24h and a replay then returns the *original* (possibly now-expired)
        // session - fine here since a submission is completed in one sitting, but not a
        // pattern to reuse for longer-lived flows without thought.
        const idempotencyKey = [...submissionIds].sort().join(",");

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
                }, { idempotencyKey: `coupon:${idempotencyKey}` })).id,
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
        }, { idempotencyKey: `session:${idempotencyKey}` });

        return NextResponse.json({
            url: session.url,
        });
    } catch (err) {
        // Stripe's own errors carry a message that's already safe to show a user (e.g.
        // "Your card was declined") and the status Stripe itself responded with - surface
        // those directly instead of flattening every failure into one generic message.
        // Anything else (env misconfiguration, a bad dependency, a bug here) is
        // unexpected, so the client still only gets a generic message, but the log line
        // below carries enough to find the exact attempt in Vercel's logs.
        if (err instanceof Stripe.errors.StripeError) {
            console.error("[create-checkout-session] Stripe error:", {
                type: err.type,
                code: err.code,
                message: err.message,
                submissionIds,
                adminTest,
            });
            return NextResponse.json(
                { error: err.message },
                { status: err.statusCode ?? 500 },
            );
        }

        console.error("[create-checkout-session] Unexpected error:", { submissionIds, adminTest }, err);

        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 },
        );
    }
}
