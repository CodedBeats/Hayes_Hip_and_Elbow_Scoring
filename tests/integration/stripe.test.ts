import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { jsonRequest, getRequest, freshIp } from "../helpers/requests";
import { calculatePrice } from "@/lib/pricing";

/**
 * Live Stripe SANDBOX smoke test - proves the rotated secret key works and that
 * create-checkout-session builds what we think it builds, against real Stripe.
 *
 * @remarks
 * Hard-guarded to test-mode keys: if STRIPE_SECRET_KEY is ever a live key, every test in
 * this file fails before a single Stripe call is made. Sessions are expired and coupons
 * deleted in afterAll. Submission IDs are random per run, so Stripe's 24h idempotency
 * cache never collides across runs.
 */

// Firestore must never be touched from here - verify-payment's write path and the
// admin-token check are both stubbed.
const mocks = vi.hoisted(() => ({ markSubmissionsPaid: vi.fn(), verifyAdminToken: vi.fn() }));
vi.mock("@/lib/payments", () => ({ markSubmissionsPaid: mocks.markSubmissionsPaid }));
vi.mock("@/lib/firebaseAdmin", () => ({ verifyAdminToken: mocks.verifyAdminToken }));

const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const isTestMode = /^(sk|rk)_test_/.test(secretKey);

const { stripe } = await import("@/lib/stripe");
const { POST } = await import("@/app/api/create-checkout-session/route");
const { GET: verifyPayment } = await import("@/app/api/verify-payment/route");

const createdSessionIds = new Set<string>();
const createdCouponIds = new Set<string>();

const runId = crypto.randomUUID();
const ids = (n: number, tag: string) => Array.from({ length: n }, (_, i) => `vitest-${runId}-${tag}_dog${i + 1}`);

// The route only returns `url`, so spy (pass-through) on the SDK to capture IDs for
// assertions and cleanup.
const sessionSpy = vi.spyOn(stripe.checkout.sessions, "create");
const couponSpy = vi.spyOn(stripe.coupons, "create");

const lastSessionId = async () => (await sessionSpy.mock.results.at(-1)!.value).id as string;

const checkout = (body: unknown) =>
    POST(jsonRequest("/api/create-checkout-session", { body, headers: { "x-forwarded-for": freshIp() } }));

beforeAll(() => {
    if (!isTestMode) {
        throw new Error(`Refusing to run: STRIPE_SECRET_KEY is not a test-mode key (starts "${secretKey.slice(0, 8)}").`);
    }
});

afterAll(async () => {
    for (const result of sessionSpy.mock.results) {
        if (result.type === "return") {
            try {
                createdSessionIds.add((await result.value).id);
            } catch {
                // a create that Stripe rejected has nothing to clean up
            }
        }
    }
    for (const result of couponSpy.mock.results) {
        if (result.type === "return") createdCouponIds.add((await result.value).id);
    }
    const cleanup = await Promise.allSettled([
        ...[...createdSessionIds].map((id) => stripe.checkout.sessions.expire(id)),
        ...[...createdCouponIds].map((id) => stripe.coupons.del(id)),
    ]);
    // an already-expired session (e.g. the idempotent replay's duplicate ID) is fine;
    // anything else means sandbox litter worth knowing about
    for (const result of cleanup) {
        if (result.status === "rejected" && !String(result.reason?.message).includes("expired")) {
            console.warn("[stripe cleanup]", result.reason?.message);
        }
    }
});

describe.skipIf(!secretKey)("Stripe sandbox (live)", () => {
    it("keys are test-mode and from the same family", () => {
        expect(secretKey).toMatch(/^(sk|rk)_test_/);
        expect(publishableKey).toMatch(/^pk_test_/);
    });

    // The key may be a restricted (rk_) key scoped to just what the app uses - Checkout
    // Sessions read/write + Coupons write - so probe with one of those, not e.g. balance.
    // A 404 (not 401/403) proves both "key is valid" and "key may read Checkout Sessions".
    it("the key authenticates and can read Checkout Sessions", async () => {
        const err = await stripe.checkout.sessions.retrieve("cs_test_vitest_does_not_exist").then(() => null, (e) => e);
        expect(err?.statusCode).toBe(404);
        expect(err?.code).toBe("resource_missing");
    });

    it("creates a real checkout session with server-side prices and our metadata", async () => {
        const submissionIds = ids(2, "basic");
        const res = await checkout({
            items: [
                { dogName: "Smoke Rex", examType: "hipsAndElbows", isDogsAustraliaRegistered: true },
                { dogName: "Smoke Bella", examType: "elbowsOnly", isDogsAustraliaRegistered: false },
            ],
            submissionIds,
        });
        expect(res.status).toBe(200);
        const { url } = await res.json();
        expect(url).toMatch(/^https:\/\/checkout\.stripe\.com\//);

        const session = await stripe.checkout.sessions.retrieve(await lastSessionId(), { expand: ["line_items"] });
        expect(session.livemode).toBe(false);
        expect(session.currency).toBe("aud");
        expect(session.payment_status).toBe("unpaid");
        expect(session.amount_total).toBe((calculatePrice("hipsAndElbows", true).total + calculatePrice("elbowsOnly", false).total) * 100);
        expect(session.metadata).toEqual({ submissionIds: submissionIds.join(","), adminTest: "false" });
        expect(session.line_items!.data.map((li) => li.description)).toEqual(["Hips & Elbows - Smoke Rex", "Elbows Only - Smoke Bella"]);
        expect(session.success_url).toBe("http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}");
    });

    it("an identical retry (double-click) returns the SAME session via the idempotency key", async () => {
        const submissionIds = ids(1, "replay");
        const body = { items: [{ dogName: "Smoke", examType: "hipsOnly", isDogsAustraliaRegistered: true }], submissionIds };
        await checkout(body);
        const first = await lastSessionId();
        await checkout(body);
        expect(await lastSessionId()).toBe(first);
    });

    // Bug #4, proven live: cancel at Stripe -> change exam type -> resubmit. Same
    // deterministic doc IDs = same idempotency key with different params, which Stripe
    // rejects outright - the customer can't check out again for 24h.
    it.fails("a changed cart for the same submission (cancel -> edit -> resubmit) still gets a checkout session", async () => {
        const submissionIds = ids(1, "edited");
        await checkout({ items: [{ dogName: "Smoke", examType: "hipsOnly", isDogsAustraliaRegistered: true }], submissionIds });
        const res = await checkout({ items: [{ dogName: "Smoke", examType: "hipsAndElbows", isDogsAustraliaRegistered: true }], submissionIds });
        expect(res.status).toBe(200);
    });

    it("admin-test checkout applies a single-use 100%-off coupon -> $0 total", async () => {
        mocks.verifyAdminToken.mockResolvedValue({ uid: "vitest-admin" });
        const res = await checkout({
            items: [{ dogName: "Smoke Admin", examType: "hipsAndElbows", isDogsAustraliaRegistered: false }],
            submissionIds: ids(1, "admin"),
            adminTest: true,
            adminIdToken: "stubbed",
        });
        expect(res.status).toBe(200);

        const session = await stripe.checkout.sessions.retrieve(await lastSessionId());
        expect(session.amount_subtotal).toBe(calculatePrice("hipsAndElbows", false).total * 100);
        expect(session.amount_total).toBe(0);
        expect(session.metadata?.adminTest).toBe("true");

        const coupon = await stripe.coupons.retrieve((await couponSpy.mock.results.at(-1)!.value).id);
        expect(coupon).toMatchObject({ percent_off: 100, max_redemptions: 1, duration: "once" });
    });

    it("verify-payment reads an unpaid session as unpaid and writes nothing", async () => {
        await checkout({ items: [{ dogName: "Smoke", examType: "elbowsOnly", isDogsAustraliaRegistered: true }], submissionIds: ids(1, "verify") });
        const res = await verifyPayment(getRequest(`/api/verify-payment?session_id=${await lastSessionId()}`));
        expect(await res.json()).toMatchObject({ paid: false, isAdminTest: false });
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
    });

    it("verify-payment 502s on a session ID Stripe doesn't know", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const res = await verifyPayment(getRequest("/api/verify-payment?session_id=cs_test_doesnotexist"));
        expect(res.status).toBe(502);
    });

    it("webhook secret is at least shaped right (end-to-end check needs `stripe listen` - see summary)", () => {
        expect(process.env.STRIPE_WEBHOOK_SECRET).toMatch(/^whsec_/);
    });
});