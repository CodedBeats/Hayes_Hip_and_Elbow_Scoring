// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { FirebaseError } from "firebase/app";
import { calculatePrice } from "@/lib/pricing";
import { makeDog, makeFiles, makeOwner, makeDogFormData } from "../../helpers/fixtures";
import type { DogDraft } from "@/components/submission/DogEntry";

const mocks = vi.hoisted(() => ({
    createSubmission: vi.fn(),
    push: vi.fn(),
    currentUser: null as null | { getIdToken: () => Promise<string> },
}));

vi.mock("@/lib/firebase", () => ({
    createSubmission: mocks.createSubmission,
    auth: {
        get currentUser() {
            return mocks.currentUser;
        },
    },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

const { useSubmissionDraft } = await import("@/hooks/useSubmissionDraft");

const DRAFT_KEY = "submission_draft";
const fetchMock = vi.fn();

const draft = (payer: "owner" | "clinic"): DogDraft => ({
    dogId: "d",
    dogData: makeDogFormData(),
    ownerData: makeOwner(),
    payer,
    uploadedFiles: null,
    uploadedNames: { dicom: [], docs: [], pdfForm: [] },
    isComplete: false,
});

const stored = () => JSON.parse(localStorage.getItem(DRAFT_KEY)!);

beforeEach(() => {
    localStorage.clear();
    mocks.createSubmission.mockReset().mockImplementation(async ({ s3SubmissionId, dogIndex }) => `${s3SubmissionId}_dog${dogIndex}`);
    mocks.push.mockReset();
    mocks.currentUser = null;
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ url: "https://checkout.stripe.com/c/pay/cs_test" }) });
    vi.stubGlobal("fetch", fetchMock);
    // jsdom logs "Not implemented: navigation" when the hook redirects to Stripe
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useSubmissionDraft - initial state & persistence", () => {
    it("starts blank with a fresh submission ID", () => {
        const { result } = renderHook(() => useSubmissionDraft());
        expect(result.current.submissionId).toMatch(/^[0-9a-f-]{36}$/);
        expect(result.current.dogCount).toBe(1);
        expect(result.current.submitterType).toBe("owner");
        expect(result.current.completedCount).toBe(0);
        expect(result.current.allComplete).toBe(false);
    });

    it("persists to localStorage and restores on the next mount", () => {
        const first = renderHook(() => useSubmissionDraft());
        act(() => {
            first.result.current.handleCountChange(2);
            first.result.current.setSubmitterType("clinic");
        });
        expect(stored()).toMatchObject({ submissionId: first.result.current.submissionId, dogCount: 2, submitterType: "clinic" });

        const second = renderHook(() => useSubmissionDraft());
        expect(second.result.current.submissionId).toBe(first.result.current.submissionId);
        expect(second.result.current.dogCount).toBe(2);
        expect(second.result.current.submitterType).toBe("clinic");
    });

    it("recovers from a corrupt stored draft instead of crashing", () => {
        localStorage.setItem(DRAFT_KEY, "{corrupt");
        const { result } = renderHook(() => useSubmissionDraft());
        expect(result.current.dogCount).toBe(1);
    });
});

describe("useSubmissionDraft - billing type derivation", () => {
    it("forces payNow for owner submissions regardless of the stale radio value", () => {
        const { result } = renderHook(() => useSubmissionDraft());
        act(() => result.current.setBillingType("batchMonthly"));
        expect(result.current.effectiveBillingType).toBe("payNow");
    });

    it("honours the radio for clinic submissions", () => {
        const { result } = renderHook(() => useSubmissionDraft());
        act(() => {
            result.current.setSubmitterType("clinic");
            result.current.setBillingType("batchMonthly");
        });
        expect(result.current.effectiveBillingType).toBe("batchMonthly");
    });

    it("forces invoice once any clinic dog is billed to its owner", () => {
        const { result } = renderHook(() => useSubmissionDraft());
        act(() => {
            result.current.setSubmitterType("clinic");
            result.current.setBillingType("payNow");
            result.current.handleDraftChange(1, draft("owner"));
        });
        expect(result.current.hasOwnerBilledDog).toBe(true);
        expect(result.current.effectiveBillingType).toBe("invoice");
    });

    it("ignores an owner-payer draft on an owner submission", () => {
        const { result } = renderHook(() => useSubmissionDraft());
        act(() => result.current.handleDraftChange(1, draft("owner")));
        expect(result.current.hasOwnerBilledDog).toBe(false);
    });
});

describe("useSubmissionDraft - dog count", () => {
    it("ignores counts below 1", () => {
        const { result } = renderHook(() => useSubmissionDraft());
        act(() => result.current.handleCountChange(0));
        expect(result.current.dogCount).toBe(1);
    });

    it("drops completed dogs and drafts above the new count", () => {
        const { result } = renderHook(() => useSubmissionDraft());
        act(() => result.current.handleCountChange(3));
        act(() => {
            for (const i of [1, 2, 3]) {
                result.current.handleDogComplete(i, makeDog({ id: `d${i}` }), makeFiles(), makeOwner(), "owner");
                result.current.handleDraftChange(i, draft("owner"));
            }
        });
        expect(result.current.completedCount).toBe(3);

        act(() => result.current.handleCountChange(1));
        expect(result.current.completedCount).toBe(1);
        expect(Object.keys(stored().completedDogs)).toEqual(["1"]);
        expect(Object.keys(result.current.dogDrafts)).toEqual(["1"]);
        expect(result.current.allComplete).toBe(true);
    });

    it("sums the server-side price of every completed dog", () => {
        const { result } = renderHook(() => useSubmissionDraft());
        act(() => result.current.handleCountChange(2));
        act(() => {
            result.current.handleDogComplete(1, makeDog({ examType: "hipsAndElbows", isDogsAustraliaRegistered: true }), makeFiles(), makeOwner(), "owner");
            result.current.handleDogComplete(2, makeDog({ examType: "elbowsOnly", isDogsAustraliaRegistered: false }), makeFiles(), makeOwner(), "owner");
        });
        expect(result.current.totalAud).toBe(
            calculatePrice("hipsAndElbows", true).total + calculatePrice("elbowsOnly", false).total,
        );
    });
});

describe("useSubmissionDraft - handleSubmit", () => {
    const setupComplete = (configure?: (r: ReturnType<typeof useSubmissionDraft>) => void) => {
        const hook = renderHook(() => useSubmissionDraft());
        act(() => configure?.(hook.result.current));
        act(() => hook.result.current.handleDogComplete(1, makeDog({ registeredName: "Rex" }), makeFiles(), makeOwner(), "owner"));
        return hook;
    };

    it("payNow: creates 'unpaid' docs, then posts the cart + doc IDs to checkout, keeping the draft", async () => {
        const { result } = setupComplete();
        await act(() => result.current.handleSubmit());

        const payload = mocks.createSubmission.mock.calls[0][0];
        expect(payload).toMatchObject({
            s3SubmissionId: result.current.submissionId,
            dogIndex: 1,
            submitterType: "owner",
            clinicInfo: undefined,
            billing: { billingType: "payNow", paymentStatus: "unpaid", amount: calculatePrice("hipsAndElbows", true).total },
        });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe("/api/create-checkout-session");
        expect(JSON.parse(init.body)).toEqual({
            items: [{ dogName: "Rex", examType: "hipsAndElbows", isDogsAustraliaRegistered: true }],
            submissionIds: [`${result.current.submissionId}_dog1`],
            adminTest: false,
        });
        // draft survives so a cancelled/declined checkout returns to a populated form
        expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();
        expect(mocks.push).not.toHaveBeenCalled();
    });

    it("invoice: creates 'pending' docs, skips Stripe, clears the draft and routes to success", async () => {
        const { result } = setupComplete((r) => {
            r.setSubmitterType("clinic");
            r.setBillingType("invoice");
        });
        await act(() => result.current.handleSubmit());

        expect(mocks.createSubmission.mock.calls[0][0].billing).toMatchObject({ billingType: "invoice", paymentStatus: "pending" });
        expect(mocks.createSubmission.mock.calls[0][0].clinicInfo).toBeDefined();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(mocks.push).toHaveBeenCalledWith("/success?mode=invoice");
        expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    });

    it("adminTest: forces payNow docs even on an invoice clinic draft, and sends the ID token", async () => {
        mocks.currentUser = { getIdToken: async () => "id-token-123" };
        const { result } = setupComplete((r) => {
            r.setSubmitterType("clinic");
            r.setBillingType("invoice");
        });
        await act(() => result.current.handleSubmit(true));

        expect(mocks.createSubmission.mock.calls[0][0].billing).toMatchObject({ billingType: "payNow", paymentStatus: "unpaid" });
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ adminTest: true, adminIdToken: "id-token-123" });
        expect(mocks.push).not.toHaveBeenCalled();
    });

    it("adminTest without a signed-in user errors before calling checkout", async () => {
        const { result } = setupComplete();
        await act(() => result.current.handleSubmit(true));
        expect(result.current.submitError).toBe("Not signed in as an admin");
        expect(result.current.isSubmitting).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("swaps Firestore's permission-denied text for something a submitter can act on", async () => {
        mocks.createSubmission.mockRejectedValue(new FirebaseError("permission-denied", "Missing or insufficient permissions."));
        const { result } = setupComplete();
        await act(() => result.current.handleSubmit());
        expect(result.current.submitError).toMatch(/^We couldn't save your submission/);
        expect(result.current.isSubmitting).toBe(false);
    });

    it("shows a generic error when checkout returns no URL", async () => {
        fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
        const { result } = setupComplete();
        await act(() => result.current.handleSubmit());
        expect(result.current.submitError).toBe("No checkout URL returned");
    });

    // Bug #3: the route deliberately returns user-safe messages (429 "Too many requests -
    // please wait a minute", Stripe's own error text) but the hook only checks for `url`
    // and replaces all of them with "No checkout URL returned".
    it.fails("surfaces the server's own error message (e.g. a 429) to the submitter", async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: "Too many requests - please wait a minute and try again." }) });
        const { result } = setupComplete();
        await act(() => result.current.handleSubmit());
        expect(result.current.submitError).toBe("Too many requests - please wait a minute and try again.");
    });
});

describe("useSubmissionDraft - reset", () => {
    it("starts a blank submission under a NEW id and overwrites the stored draft", () => {
        const { result } = renderHook(() => useSubmissionDraft());
        const oldId = result.current.submissionId;
        act(() => {
            result.current.handleCountChange(3);
            result.current.setSubmitterType("clinic");
            result.current.handleDogComplete(1, makeDog(), makeFiles(), makeOwner(), "owner");
        });
        act(() => result.current.handleResetSubmission());

        expect(result.current.submissionId).not.toBe(oldId);
        expect(result.current.dogCount).toBe(1);
        expect(result.current.submitterType).toBe("owner");
        expect(result.current.completedCount).toBe(0);
        expect(stored()).toMatchObject({ submissionId: result.current.submissionId, dogCount: 1, completedDogs: {} });
    });
});
