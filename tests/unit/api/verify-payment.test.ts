import { describe, it, expect, vi, beforeEach } from "vitest";
import { getRequest } from "../../helpers/requests";

const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), markSubmissionsPaid: vi.fn() }));

vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { retrieve: mocks.retrieve } } } }));
vi.mock("@/lib/payments", () => ({ markSubmissionsPaid: mocks.markSubmissionsPaid }));

const { GET } = await import("@/app/api/verify-payment/route");

const session = (overrides: Record<string, unknown> = {}) => ({
    id: "cs_1",
    payment_status: "paid",
    payment_intent: "pi_1",
    metadata: { submissionIds: "a_dog1,a_dog2", adminTest: "false" },
    ...overrides,
});

const get = (sessionId?: string) =>
    GET(getRequest(sessionId === undefined ? "/api/verify-payment" : `/api/verify-payment?session_id=${sessionId}`));

beforeEach(() => {
    mocks.retrieve.mockReset();
    mocks.markSubmissionsPaid.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/verify-payment", () => {
    it("400s without a session_id", async () => {
        const res = await get();
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ paid: false });
        expect(mocks.retrieve).not.toHaveBeenCalled();
    });

    it("marks a paid session's submissions as paid, using IDs from Stripe metadata only", async () => {
        mocks.retrieve.mockResolvedValue(session());
        const res = await get("cs_1");
        expect(mocks.retrieve).toHaveBeenCalledWith("cs_1");
        expect(mocks.markSubmissionsPaid).toHaveBeenCalledWith(["a_dog1", "a_dog2"], "paid", "pi_1");
        expect(await res.json()).toEqual({ paid: true, isAdminTest: false, submissionIds: ["a_dog1", "a_dog2"] });
    });

    it("treats a $0 admin-test session (no_payment_required) as paid, status 'test', no PaymentIntent", async () => {
        mocks.retrieve.mockResolvedValue(session({ payment_status: "no_payment_required", payment_intent: null, metadata: { submissionIds: "t_dog1", adminTest: "true" } }));
        const res = await get("cs_1");
        expect(mocks.markSubmissionsPaid).toHaveBeenCalledWith(["t_dog1"], "test", null);
        expect(await res.json()).toMatchObject({ paid: true, isAdminTest: true });
    });

    it("ignores an expanded payment_intent object (only a string ID is persisted)", async () => {
        mocks.retrieve.mockResolvedValue(session({ payment_intent: { id: "pi_obj" } }));
        await get("cs_1");
        expect(mocks.markSubmissionsPaid).toHaveBeenCalledWith(["a_dog1", "a_dog2"], "paid", null);
    });

    it("writes nothing for an unpaid session", async () => {
        mocks.retrieve.mockResolvedValue(session({ payment_status: "unpaid" }));
        const res = await get("cs_1");
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
        expect(await res.json()).toMatchObject({ paid: false });
    });

    it("filters whitespace and empty IDs from metadata", async () => {
        mocks.retrieve.mockResolvedValue(session({ metadata: { submissionIds: " a_dog1 ,, a_dog2 , " } }));
        await get("cs_1");
        expect(mocks.markSubmissionsPaid).toHaveBeenCalledWith(["a_dog1", "a_dog2"], "paid", "pi_1");
    });

    it("skips the write when a paid session has no submission IDs", async () => {
        mocks.retrieve.mockResolvedValue(session({ metadata: {} }));
        const res = await get("cs_1");
        expect(mocks.markSubmissionsPaid).not.toHaveBeenCalled();
        expect(await res.json()).toMatchObject({ paid: true, submissionIds: [] });
    });

    it("still reports paid when the Firestore write fails (the webhook reconciles it)", async () => {
        mocks.retrieve.mockResolvedValue(session());
        mocks.markSubmissionsPaid.mockRejectedValue(new Error("firestore down"));
        const res = await get("cs_1");
        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({ paid: true });
    });

    it("502s when the session can't be retrieved from Stripe", async () => {
        mocks.retrieve.mockRejectedValue(new Error("No such checkout.session"));
        const res = await get("cs_bogus");
        expect(res.status).toBe(502);
        expect(await res.json()).toEqual({ paid: false, error: "Could not verify payment" });
    });
});