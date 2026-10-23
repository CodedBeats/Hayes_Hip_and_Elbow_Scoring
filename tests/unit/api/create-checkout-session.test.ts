import { describe, it, expect, vi, beforeEach } from "vitest";
import Stripe from "stripe";
import { jsonRequest, freshIp } from "../../helpers/requests";
import { calculatePrice } from "@/lib/pricing";

const mocks = vi.hoisted(() => ({
    sessionsCreate: vi.fn(),
    couponsCreate: vi.fn(),
    verifyAdminToken: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
    stripe: {
        checkout: { sessions: { create: mocks.sessionsCreate } },
        coupons: { create: mocks.couponsCreate },
    },
}));
vi.mock("@/lib/firebaseAdmin", () => ({ verifyAdminToken: mocks.verifyAdminToken }));

const { POST } = await import("@/app/api/create-checkout-session/route");

const item = (overrides = {}) => ({ dogName: "Rex", examType: "hipsAndElbows", isDogsAustraliaRegistered: true, ...overrides });

const post = (body: unknown, ip = freshIp()) =>
    POST(jsonRequest("/api/create-checkout-session", { body, headers: { "x-forwarded-for": ip } }));

beforeEach(() => {
    mocks.sessionsCreate.mockReset().mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1" });
    mocks.couponsCreate.mockReset().mockResolvedValue({ id: "coupon_1" });
    mocks.verifyAdminToken.mockReset().mockResolvedValue({ uid: "admin" });
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/create-checkout-session - validation", () => {
    it.each([
        ["no items", { submissionIds: ["a"] }, "Missing items or submissionIds"],
        ["no submissionIds", { items: [item()] }, "Missing items or submissionIds"],
        ["empty arrays", { items: [], submissionIds: [] }, "Missing items or submissionIds"],
        ["length mismatch", { items: [item(), item()], submissionIds: ["a"] }, "items and submissionIds must be the same length"],
        ["too many items", { items: Array(21).fill(item()), submissionIds: Array.from({ length: 21 }, (_, i) => `s${i}`) }, "Too many items"],
        ["bad exam type", { items: [item({ examType: "spine" })], submissionIds: ["a"] }, "Invalid exam type"],
        ["prototype key as exam type", { items: [item({ examType: "__proto__" })], submissionIds: ["a"] }, "Invalid exam type"],
        ["blank dog name", { items: [item({ dogName: "   " })], submissionIds: ["a"] }, "Invalid dog name"],
        ["missing dog name", { items: [item({ dogName: undefined })], submissionIds: ["a"] }, "Invalid dog name"],
        ["201-char dog name", { items: [item({ dogName: "x".repeat(201) })], submissionIds: ["a"] }, "Invalid dog name"],
    ])("400s on %s", async (_label, body, error) => {
        const res = await post(body);
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error });
        expect(mocks.sessionsCreate).not.toHaveBeenCalled();
    });

    it("accepts exactly 20 items and a 200-char name", async () => {
        const res = await post({
            items: Array(20).fill(item({ dogName: "x".repeat(200) })),
            submissionIds: Array.from({ length: 20 }, (_, i) => `s${i}`),
        });
        expect(res.status).toBe(200);
    });

    it("400s on malformed JSON", async () => {
        const res = await POST(jsonRequest("/api/create-checkout-session", { body: "{not json", headers: { "x-forwarded-for": freshIp() } }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Malformed request body" });
    });
});

describe("POST /api/create-checkout-session - rate limiting", () => {
    it("allows 10 requests per IP per minute, then 429s with Retry-After", async () => {
        const ip = freshIp();
        for (let i = 0; i < 10; i++) expect((await post({ items: [item()], submissionIds: ["a"] }, ip)).status).toBe(200);
        const res = await post({ items: [item()], submissionIds: ["a"] }, ip);
        expect(res.status).toBe(429);
        expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
        // a different client is unaffected
        expect((await post({ items: [item()], submissionIds: ["a"] })).status).toBe(200);
    });

    it("rate-limits before parsing, so even junk bodies count", async () => {
        const ip = freshIp();
        for (let i = 0; i < 10; i++) await post("junk", ip);
        expect((await post({ items: [item()], submissionIds: ["a"] }, ip)).status).toBe(429);
    });
});

describe("POST /api/create-checkout-session - admin test gating", () => {
    it("401s an adminTest request with no token", async () => {
        const res = await post({ items: [item()], submissionIds: ["a"], adminTest: true });
        expect(res.status).toBe(401);
        expect(mocks.couponsCreate).not.toHaveBeenCalled();
    });

    it("401s an adminTest request with an invalid token", async () => {
        mocks.verifyAdminToken.mockRejectedValue(new Error("bad token"));
        const res = await post({ items: [item()], submissionIds: ["a"], adminTest: true, adminIdToken: "forged" });
        expect(res.status).toBe(401);
        expect(mocks.sessionsCreate).not.toHaveBeenCalled();
    });

    it("creates a single-use 100%-off coupon for a verified admin", async () => {
        const res = await post({ items: [item(), item()], submissionIds: ["b", "a"], adminTest: true, adminIdToken: "real" });
        expect(res.status).toBe(200);
        expect(mocks.verifyAdminToken).toHaveBeenCalledWith("real");
        expect(mocks.couponsCreate).toHaveBeenCalledWith(
            expect.objectContaining({ percent_off: 100, duration: "once", max_redemptions: 1 }),
            { idempotencyKey: "coupon:a,b" },
        );
        const [params] = mocks.sessionsCreate.mock.calls[0];
        expect(params.discounts).toEqual([{ coupon: "coupon_1" }]);
        expect(params.metadata.adminTest).toBe("true");
    });

    it("never creates a coupon for a normal checkout", async () => {
        await post({ items: [item()], submissionIds: ["a"] });
        expect(mocks.couponsCreate).not.toHaveBeenCalled();
        expect(mocks.verifyAdminToken).not.toHaveBeenCalled();
        expect(mocks.sessionsCreate.mock.calls[0][0].discounts).toBeUndefined();
    });
});

describe("POST /api/create-checkout-session - session payload", () => {
    it("prices every line server-side from lib/pricing, ignoring any client-sent amount", async () => {
        await post({
            items: [
                { ...item({ dogName: "Rex" }), total: 1, unit_amount: 1, price: 0.01 },
                item({ dogName: "Bella", examType: "elbowsOnly", isDogsAustraliaRegistered: false }),
            ],
            submissionIds: ["s_dog1", "s_dog2"],
        });
        const [params] = mocks.sessionsCreate.mock.calls[0];
        expect(params.line_items).toEqual([
            {
                price_data: { currency: "aud", product_data: { name: "Hips & Elbows - Rex" }, unit_amount: calculatePrice("hipsAndElbows", true).total * 100 },
                quantity: 1,
            },
            {
                price_data: { currency: "aud", product_data: { name: "Elbows Only - Bella" }, unit_amount: calculatePrice("elbowsOnly", false).total * 100 },
                quantity: 1,
            },
        ]);
    });

    it("passes submission IDs through metadata and builds redirect URLs from the request origin", async () => {
        await post({ items: [item(), item()], submissionIds: ["s_dog1", "s_dog2"] });
        const [params] = mocks.sessionsCreate.mock.calls[0];
        expect(params.mode).toBe("payment");
        expect(params.metadata).toEqual({ submissionIds: "s_dog1,s_dog2", adminTest: "false" });
        expect(params.success_url).toBe("http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}");
        expect(params.cancel_url).toBe("http://localhost:3000/cancel");
    });

    it("derives the idempotency key from the SORTED ids, so order doesn't matter", async () => {
        await post({ items: [item(), item()], submissionIds: ["z_dog2", "a_dog1"] });
        await post({ items: [item(), item()], submissionIds: ["a_dog1", "z_dog2"] });
        expect(mocks.sessionsCreate.mock.calls[0][1]).toEqual({ idempotencyKey: "session:a_dog1,z_dog2" });
        expect(mocks.sessionsCreate.mock.calls[1][1]).toEqual({ idempotencyKey: "session:a_dog1,z_dog2" });
    });

    it("returns the Stripe checkout URL", async () => {
        const res = await post({ items: [item()], submissionIds: ["a"] });
        expect(await res.json()).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });
    });

    // Bug #4: customer cancels at Stripe, goes back, changes exam type, resubmits within
    // 24h. Doc IDs are deterministic, so the key is identical but the line items differ -
    // and Stripe rejects a reused idempotency key with different params (idempotency_error).
    // Proven against the real sandbox in tests/integration/stripe.test.ts.
    it.fails("gives a changed cart (same submission IDs, different exam type) a different idempotency key", async () => {
        await post({ items: [item({ examType: "hipsOnly" })], submissionIds: ["s_dog1"] });
        await post({ items: [item({ examType: "hipsAndElbows" })], submissionIds: ["s_dog1"] });
        expect(mocks.sessionsCreate.mock.calls[0][1]).not.toEqual(mocks.sessionsCreate.mock.calls[1][1]);
    });
});

describe("POST /api/create-checkout-session - error handling", () => {
    it("surfaces a Stripe error's own message and status", async () => {
        mocks.sessionsCreate.mockRejectedValue(
            new Stripe.errors.StripeInvalidRequestError({ message: "Keys for idempotent requests can only be used with the same parameters", type: "idempotency_error", statusCode: 400 } as never),
        );
        const res = await post({ items: [item()], submissionIds: ["a"] });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "Keys for idempotent requests can only be used with the same parameters" });
    });

    it("hides unexpected errors behind a generic 500", async () => {
        mocks.sessionsCreate.mockRejectedValue(new TypeError("Cannot read properties of undefined (secret internals)"));
        const res = await post({ items: [item()], submissionIds: ["a"] });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: "Failed to create checkout session" });
    });
});