import { describe, it, expect, vi, beforeEach } from "vitest";
import { FieldValue } from "firebase-admin/firestore";
import { createFakeFirestore } from "../../helpers/fakeFirestore";

const fake = vi.hoisted(() => ({ current: undefined as ReturnType<typeof createFakeFirestore> | undefined }));
vi.mock("@/lib/firebaseAdmin", () => ({ getAdminDb: () => fake.current!.db }));

const { markSubmissionsPaid } = await import("@/lib/payments");

beforeEach(() => {
    // fine to replace per test here - payments.ts calls getAdminDb() (mocked) on every write
    fake.current = createFakeFirestore();
    fake.current.docs.set("submissions/a_dog1", { billing: { paymentStatus: "unpaid" } });
    fake.current.docs.set("submissions/a_dog2", { billing: { paymentStatus: "unpaid" } });
});

describe("markSubmissionsPaid", () => {
    it("writes one dotted-path update per submission", async () => {
        await markSubmissionsPaid(["a_dog1", "a_dog2"], "paid", "pi_123");
        expect(fake.current!.update).toHaveBeenCalledTimes(2);
        expect(fake.current!.update).toHaveBeenCalledWith("submissions/a_dog1", {
            "billing.paymentStatus": "paid",
            "billing.stripePaymentIntentId": "pi_123",
            updatedAt: FieldValue.serverTimestamp(),
        });
    });

    it.each([null, undefined])("omits stripePaymentIntentId when it's %s ($0 admin-test sessions)", async (pi) => {
        await markSubmissionsPaid(["a_dog1"], "test", pi);
        const [, data] = fake.current!.update.mock.calls[0];
        expect(data).not.toHaveProperty("billing.stripePaymentIntentId");
        expect(data["billing.paymentStatus"]).toBe("test");
    });

    it("is idempotent - running twice yields the same state", async () => {
        await markSubmissionsPaid(["a_dog1"], "paid", "pi_1");
        const first = structuredClone(fake.current!.docs.get("submissions/a_dog1"));
        await markSubmissionsPaid(["a_dog1"], "paid", "pi_1");
        expect(fake.current!.docs.get("submissions/a_dog1")).toEqual(first);
    });

    it("rejects (not silently creates) when a doc is missing - .update() not merge-set", async () => {
        await expect(markSubmissionsPaid(["a_dog1", "ghost"], "paid", "pi_1")).rejects.toThrow("NOT_FOUND");
        expect(fake.current!.docs.has("submissions/ghost")).toBe(false);
    });

    it("does nothing for an empty list", async () => {
        await markSubmissionsPaid([], "paid");
        expect(fake.current!.update).not.toHaveBeenCalled();
    });
});