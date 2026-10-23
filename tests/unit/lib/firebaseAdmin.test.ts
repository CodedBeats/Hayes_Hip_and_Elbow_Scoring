import { describe, it, expect, vi, beforeEach } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { createFakeFirestore, snap } from "../../helpers/fakeFirestore";

const fake = vi.hoisted(() => ({ current: undefined as ReturnType<typeof createFakeFirestore> | undefined }));
const verifyIdToken = vi.hoisted(() => vi.fn());

vi.mock("firebase-admin/app", () => ({
    cert: vi.fn((c) => c),
    getApps: vi.fn(() => []),
    getApp: vi.fn(),
    initializeApp: vi.fn(() => ({})),
}));
vi.mock("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken }) }));
// Real Timestamp (mapSubmissionDoc relies on `instanceof Timestamp`), fake handle.
vi.mock("firebase-admin/firestore", async (importOriginal) => ({
    ...(await importOriginal<typeof import("firebase-admin/firestore")>()),
    getFirestore: () => fake.current!.db,
}));
// firebaseAdmin.ts imports this only for a TSDoc link - stop it initialising the client SDK.
vi.mock("@/lib/firebase", () => ({}));

const {
    getSubmissionById,
    getAllSubmissions,
    getTestSubmissionById,
    getStaleDraftSubmissions,
    getStaleUnpaidSubmissions,
    deleteSubmissionDoc,
    verifyAdminToken,
} = await import("@/lib/firebaseAdmin");

beforeEach(() => {
    // getAdminDb() caches the handle, so swap the backing store rather than the handle
    if (!fake.current) fake.current = createFakeFirestore();
    fake.current.docs.clear();
    fake.current.whereCalls.length = 0;
    fake.current.setQueryResults([]);
});

const fullDoc = () => ({
    status: "pendingReview",
    submitterType: "owner",
    payer: "owner",
    s3SubmissionId: "s1",
    dogIndex: 1,
    createdAt: Timestamp.fromDate(new Date("2026-03-01T10:00:00Z")),
    updatedAt: Timestamp.fromDate(new Date("2026-03-02T10:00:00Z")),
    archived: false,
    archivedBy: "",
    billing: {
        billingType: "invoice",
        amount: 133,
        paymentStatus: "pending",
        invoiceSentAt: Timestamp.fromDate(new Date("2026-03-03T10:00:00Z")),
    },
    owner: { name: "Jane", email: "jane@example.com", phone: "+61 4", address: "1 St", memberNumber: "M1" },
    dog: {
        id: "client-side-id",
        examType: "hipsOnly",
        isDogsAustraliaRegistered: true,
        registeredName: "Rex",
        registeredNumber: null,
        microchipNumber: "123",
        breed: "Lab",
        sex: "male",
        dateOfBirth: "2022-01-01",
        dicomFilesRef: ["submissions/s1/dog1/dicom/0f8fad5b-d9cb-469f-a165-70867728950e-hip view.dcm"],
        supportingDocumentsRef: [],
        sneakyExtraField: "should not leak",
    },
    pdfFormRef: "submissions/s1/dog1/pdf-forms/7c9e6679-7425-40de-944b-e07fc1f90ae7-form.pdf",
});

describe("getSubmissionById (mapSubmissionDoc)", () => {
    it("returns null for a missing doc", async () => {
        expect(await getSubmissionById("nope")).toBeNull();
    });

    it("converts every Timestamp back into a Date, including nested billing.invoiceSentAt", async () => {
        fake.current!.docs.set("submissions/s1_dog1", fullDoc());
        const sub = (await getSubmissionById("s1_dog1"))!;
        expect(sub.createdAt).toEqual(new Date("2026-03-01T10:00:00Z"));
        expect(sub.updatedAt).toEqual(new Date("2026-03-02T10:00:00Z"));
        expect(sub.billing.invoiceSentAt).toEqual(new Date("2026-03-03T10:00:00Z"));
    });

    it("accepts a hand-edited string date too", async () => {
        fake.current!.docs.set("submissions/x", { ...fullDoc(), createdAt: "2026-01-05T00:00:00Z" });
        expect((await getSubmissionById("x"))!.createdAt).toEqual(new Date("2026-01-05T00:00:00Z"));
    });

    it("uses the Firestore doc ID as dog.id and coerces null registeredNumber to undefined", async () => {
        fake.current!.docs.set("submissions/s1_dog1", fullDoc());
        const { dog } = (await getSubmissionById("s1_dog1"))!;
        expect(dog.id).toBe("s1_dog1");
        expect(dog.registeredNumber).toBeUndefined();
    });

    it("builds the dog field-by-field so stray Firestore fields never leak through", async () => {
        fake.current!.docs.set("submissions/s1_dog1", fullDoc());
        const { dog } = (await getSubmissionById("s1_dog1"))!;
        expect(dog).not.toHaveProperty("sneakyExtraField");
        expect(dog).not.toHaveProperty("dicomFilesRef");
    });

    it("rebuilds file stubs from refs, stripping the uuid prefix to recover the original filename", async () => {
        fake.current!.docs.set("submissions/s1_dog1", fullDoc());
        const { files } = (await getSubmissionById("s1_dog1"))!;
        expect(files.dicomFiles).toEqual([
            {
                key: "submissions/s1/dog1/dicom/0f8fad5b-d9cb-469f-a165-70867728950e-hip view.dcm",
                fileName: "hip view.dcm",
                size: 0,
                contentType: "",
                uploadedAt: new Date(0),
                url: undefined,
            },
        ]);
        expect(files.supportingDocuments).toEqual([]);
        expect(files.pdfForm?.fileName).toBe("form.pdf");
    });

    it("leaves a filename alone if it has no uuid prefix", async () => {
        fake.current!.docs.set("submissions/x", { ...fullDoc(), pdfFormRef: "submissions/s1/dog1/pdf-forms/legacy.pdf" });
        expect((await getSubmissionById("x"))!.files.pdfForm?.fileName).toBe("legacy.pdf");
    });

    it("maps a null pdfFormRef to no pdfForm", async () => {
        fake.current!.docs.set("submissions/x", { ...fullDoc(), pdfFormRef: null });
        expect((await getSubmissionById("x"))!.files.pdfForm).toBeUndefined();
    });

    it("fills clinicInfo defaults when present, omits it when absent", async () => {
        fake.current!.docs.set("submissions/a", fullDoc());
        fake.current!.docs.set("submissions/b", { ...fullDoc(), clinicInfo: { clinicName: "Vet Co" } });
        expect((await getSubmissionById("a"))!.clinicInfo).toBeUndefined();
        expect((await getSubmissionById("b"))!.clinicInfo).toEqual({ clinicName: "Vet Co", contactName: "", email: "", phone: "" });
    });

    // Drafts live in the same `submissions` collection, so the dashboard's
    // getAllSubmissions() maps them too - a bare draft must not crash the whole page.
    it("tolerates a draft-shaped doc (no owner/dog/billing)", async () => {
        fake.current!.docs.set("submissions/d_dog1", {
            s3SubmissionId: "d",
            dogIndex: 1,
            status: "draft",
            files: { dicomFiles: [], supportingDocuments: [] },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        const sub = (await getSubmissionById("d_dog1"))!;
        expect(sub.status).toBe("draft");
        expect(sub.owner).toEqual({ name: "", email: "", phone: "", address: "", memberNumber: "" });
        expect(sub.files).toEqual({ dicomFiles: [], supportingDocuments: [], pdfForm: undefined });
        expect(sub.billing.paymentStatus).toBeUndefined();
    });

    it("reads from testSubmissions for the test-data helpers", async () => {
        fake.current!.docs.set("testSubmissions/t1", fullDoc());
        expect(await getSubmissionById("t1")).toBeNull();
        expect((await getTestSubmissionById("t1"))!.id).toBe("t1");
    });
});

describe("getAllSubmissions", () => {
    it("maps every doc in the collection", async () => {
        fake.current!.docs.set("submissions/a", fullDoc());
        fake.current!.docs.set("submissions/b", fullDoc());
        fake.current!.docs.set("testSubmissions/c", fullDoc());
        expect((await getAllSubmissions()).map((s) => s.id).sort()).toEqual(["a", "b"]);
    });
});

describe("getStaleDraftSubmissions", () => {
    it("queries drafts older than the cutoff", async () => {
        const cutoff = new Date("2026-03-01T00:00:00Z");
        await getStaleDraftSubmissions(cutoff);
        expect(fake.current!.whereCalls).toEqual([
            ["status", "==", "draft"],
            ["updatedAt", "<", Timestamp.fromDate(cutoff)],
        ]);
    });

    it("skips docs with a billing field - a real submission an admin reverted to draft", async () => {
        const files = { dicomFiles: [], supportingDocuments: [] };
        fake.current!.setQueryResults([
            snap("genuine_dog1", { status: "draft", files }),
            snap("reverted_dog1", { status: "draft", files, billing: { paymentStatus: "paid" } }),
        ]);
        expect(await getStaleDraftSubmissions(new Date())).toEqual([{ id: "genuine_dog1", files }]);
    });
});

describe("getStaleUnpaidSubmissions", () => {
    it("guards on pendingReview + unpaid + age", async () => {
        const cutoff = new Date("2026-03-01T00:00:00Z");
        await getStaleUnpaidSubmissions(cutoff);
        expect(fake.current!.whereCalls).toEqual([
            ["status", "==", "pendingReview"],
            ["billing.paymentStatus", "==", "unpaid"],
            ["updatedAt", "<", Timestamp.fromDate(cutoff)],
        ]);
    });

    it("returns id + files for each match", async () => {
        const files = { dicomFiles: [], supportingDocuments: [] };
        fake.current!.setQueryResults([snap("a", { files })]);
        expect(await getStaleUnpaidSubmissions(new Date())).toEqual([{ id: "a", files }]);
    });
});

describe("deleteSubmissionDoc", () => {
    it("deletes from the submissions collection", async () => {
        fake.current!.docs.set("submissions/a", {});
        await deleteSubmissionDoc("a");
        expect(fake.current!.docs.has("submissions/a")).toBe(false);
    });
});

describe("verifyAdminToken", () => {
    it("delegates to Admin Auth and propagates rejection", async () => {
        verifyIdToken.mockResolvedValueOnce({ uid: "admin1" });
        await expect(verifyAdminToken("good")).resolves.toEqual({ uid: "admin1" });
        verifyIdToken.mockRejectedValueOnce(new Error("auth/argument-error"));
        await expect(verifyAdminToken("bad")).rejects.toThrow("auth/argument-error");
    });
});