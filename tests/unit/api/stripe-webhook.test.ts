import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ markSubmissionsPaid: vi.fn() }));
vi.mock("@/lib/payments", () => ({ markSubmissionsPaid: mocks.markSubmissionsPaid }));

// lib/stripe is NOT mocked: signature verification is real HMAC-SHA256 against the dummy
// STRIPE_WEBHOOK_SECRET from tests/setup.ts - no network involved.
const { stripe } = await import("@/lib/stripe");
const { POST } = await import("@/app/api/webhooks/stripe/route");

const SECRET = "whsec_test_dummy_unit";

const event = (type: string, object: Record<string, unknown>) =>
    JSON.stringify({ id: "evt_1", object: "event", type, data: { object } });

const completedSession = (overrides: Record<string, unknown> = {}) =>
    event("checkout.session.completed", {
        id: "cs_1",
        object: "checkout.session",
        payment_status: "paid",
        payment_intent: "pi_1",
        metadata: { submissionIds: "a_dog1,a_dog2", adminTest: "false" },
        ...overrides,
    });

const signed = (payload: string, secret = SECRET) =>
    new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": stripe.webhooks.generateTestHeaderString({ payload, secret }) },
        body: payload,
    });

beforeEach(() => {
    mocks.markSubmissionsPaid.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/webhooks/stripe - signature", () => {
    it("400s without a stripe-signature header", async () => {
        const res = await POST(new Request("http://x", { method: "POST", body: completedSession() }));
        expect(res.status).toBe(400);
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
    });

    it("400s if STRIPE_WEBHOOK_SECRET is unset", async () => {
        vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
        const res = await POST(signed(completedSession()));
        expect(res.status).toBe(400);
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
    });

    it("400s a payload signed with a different secret", async () => {
        const res = await POST(signed(completedSession(), "whsec_attacker"));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Invalid signature" });
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
    });

    it("400s a body tampered with after signing", async () => {
        const payload = completedSession();
        const req = signed(payload);
        const tampered = new Request(req.url, {
            method: "POST",
            headers: req.headers,
            body: payload.replace("a_dog1,a_dog2", "victim_dog1"),
        });
        expect((await POST(tampered)).status).toBe(400);
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
    });

    // Bug #6: logging the whole StripeSignatureVerificationError dumps its `payload` -
    // a real checkout's customer name/email/phone/address - into Vercel logs.
    it.fails("never logs the event payload (customer PII) when verification fails", async () => {
        const pii = "jane.private@example.com";
        await POST(signed(completedSession({ customer_details: { email: pii } }), "whsec_wrong"));
        const logged = vi.mocked(console.error).mock.calls.flat().map((arg) => (arg instanceof Error ? JSON.stringify({ ...arg }) : String(arg))).join(" ");
        expect(logged).not.toContain(pii);
    });

    it("400s a replayed signature older than Stripe's 5-minute tolerance", async () => {
        const payload = completedSession();
        const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET, timestamp: Math.floor(Date.now() / 1000) - 600 });
        const res = await POST(new Request("http://x", { method: "POST", headers: { "stripe-signature": header }, body: payload }));
        expect(res.status).toBe(400);
    });
});

describe("POST /api/webhooks/stripe - handling", () => {
    it("marks submissions paid for a valid completed session", async () => {
        const res = await POST(signed(completedSession()));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ received: true });
        expect(mocks.markSubmissionsPaid).toHaveBeenCalledWith(["a_dog1", "a_dog2"], "paid", "pi_1");
    });

    it("records an admin-test $0 session as 'test'", async () => {
        await POST(signed(completedSession({ payment_status: "no_payment_required", payment_intent: null, metadata: { submissionIds: "t_dog1", adminTest: "true" } })));
        expect(mocks.markSubmissionsPaid).toHaveBeenCalledWith(["t_dog1"], "test", null);
    });

    it.each(["payment_intent.succeeded", "checkout.session.expired", "charge.refunded"])("acknowledges (200) but ignores %s", async (type) => {
        const res = await POST(signed(event(type, { id: "x" })));
        expect(res.status).toBe(200);
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
    });

    it("acknowledges but doesn't record a completed-but-unpaid (async payment) session", async () => {
        const res = await POST(signed(completedSession({ payment_status: "unpaid" })));
        expect(res.status).toBe(200);
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
    });

    it("acknowledges a session with no submissionIds metadata (e.g. `stripe trigger`) without writing", async () => {
        const res = await POST(signed(completedSession({ metadata: {} })));
        expect(res.status).toBe(200);
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
    });

    it("500s when the write fails so Stripe retries", async () => {
        mocks.markSubmissionsPaid.mockRejectedValue(new Error("firestore down"));
        const res = await POST(signed(completedSession()));
        expect(res.status).toBe(500);
    });
});