import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeDog, makeFiles, makeOwner } from "../../helpers/fixtures";

// Sentinels stand in for Firestore's special values so assertions can see exactly where
// serverTimestamp()/deleteField() were used.
const SERVER_TS = "<serverTimestamp>";
const DELETE_FIELD = "<deleteField>";

const fs = vi.hoisted(() => ({
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    getDoc: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
}));

vi.mock("firebase/app", () => ({ initializeApp: vi.fn(() => ({})) }));
vi.mock("firebase/auth", () => ({
    getAuth: vi.fn(() => ({ name: "auth" })),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: fs.sendPasswordResetEmail,
}));
vi.mock("firebase/firestore", () => ({
    getFirestore: vi.fn(() => ({})),
    doc: vi.fn((_db: unknown, collection: string, id: string) => ({ path: `${collection}/${id}`, id })),
    setDoc: fs.setDoc,
    updateDoc: fs.updateDoc,
    getDoc: fs.getDoc,
    serverTimestamp: () => SERVER_TS,
    deleteField: () => DELETE_FIELD,
}));

const {
    saveDraftFiles,
    createSubmission,
    updateSubmissionStatus,
    archiveSubmission,
    restoreSubmission,
    getFirestoreErrorMessage,
    resetPassword,
    SAMPLE_TEST_SUBMISSION,
} = await import("@/lib/firebase");

beforeEach(() => {
    fs.setDoc.mockReset().mockResolvedValue(undefined);
    fs.updateDoc.mockReset().mockResolvedValue(undefined);
    fs.getDoc.mockReset();
});

const docExists = (exists: boolean) => fs.getDoc.mockResolvedValue({ exists: () => exists });

describe("saveDraftFiles", () => {
    it("writes to the deterministic {submissionId}_dog{index} doc", async () => {
        docExists(false);
        await saveDraftFiles("abc-123", 2, makeFiles());
        expect(fs.setDoc.mock.calls[0][0].path).toBe("submissions/abc-123_dog2");
    });

    it("stamps status 'draft' + createdAt only on the very first write", async () => {
        docExists(false);
        const files = makeFiles();
        await saveDraftFiles("s1", 1, files);

        const [, data, opts] = fs.setDoc.mock.calls[0];
        expect(opts).toEqual({ merge: true });
        expect(data).toEqual({
            s3SubmissionId: "s1",
            dogIndex: 1,
            files: { dicomFiles: files.dicomFiles, supportingDocuments: files.supportingDocuments, pdfForm: files.pdfForm },
            updatedAt: SERVER_TS,
            status: "draft",
            createdAt: SERVER_TS,
        });
    });

    it("never touches status/createdAt on later writes (keeps a returned-from-Stripe doc at pendingReview)", async () => {
        docExists(true);
        await saveDraftFiles("s1", 1, makeFiles());

        const [, data] = fs.setDoc.mock.calls[0];
        expect(data).not.toHaveProperty("status");
        expect(data).not.toHaveProperty("createdAt");
        expect(data.updatedAt).toBe(SERVER_TS);
        // matches firestore.rules update branch (c): only files/updatedAt may change
        // (s3SubmissionId/dogIndex are re-written with identical values, so not a "change")
        expect(Object.keys(data).sort()).toEqual(["dogIndex", "files", "s3SubmissionId", "updatedAt"]);
    });

    it("writes deleteField() for a missing pdfForm instead of undefined (setDoc rejects undefined)", async () => {
        docExists(true);
        await saveDraftFiles("s1", 1, makeFiles({ pdfForm: undefined }));
        expect(fs.setDoc.mock.calls[0][1].files.pdfForm).toBe(DELETE_FIELD);
    });

    it("only ever writes field names allowed by the draft-create rule", async () => {
        docExists(false);
        await saveDraftFiles("s1", 1, makeFiles());
        const allowed = ["s3SubmissionId", "dogIndex", "status", "files", "updatedAt", "createdAt"];
        expect(Object.keys(fs.setDoc.mock.calls[0][1]).every((k) => allowed.includes(k))).toBe(true);
    });

    it("propagates a rejected write so the caller can surface it", async () => {
        docExists(true);
        fs.setDoc.mockRejectedValue(Object.assign(new Error("denied"), { code: "permission-denied" }));
        await expect(saveDraftFiles("s1", 1, makeFiles())).rejects.toThrow("denied");
    });
});

describe("createSubmission", () => {
    const payload = () => ({
        s3SubmissionId: "s1",
        dogIndex: 1,
        submitterType: "owner" as const,
        payer: "owner" as const,
        owner: makeOwner(),
        dog: makeDog({ registeredNumber: undefined }),
        files: makeFiles(),
        billing: { billingType: "payNow" as const, amount: 133, paymentStatus: "unpaid" as const },
    });

    it("upserts onto the same doc ID the draft used and returns it", async () => {
        const id = await createSubmission(payload());
        expect(id).toBe("s1_dog1");
        expect(fs.setDoc.mock.calls[0][0].path).toBe("submissions/s1_dog1");
        expect(fs.setDoc.mock.calls[0][2]).toEqual({ merge: true });
    });

    it("includes every field the firestore.rules pendingReview branch requires", async () => {
        await createSubmission(payload());
        const data = fs.setDoc.mock.calls[0][1];
        const required = [
            "status", "s3SubmissionId", "dogIndex", "submitterType", "payer",
            "createdAt", "updatedAt", "archived", "archivedBy", "billing", "owner", "dog",
        ];
        for (const key of required) expect(data).toHaveProperty(key);
        expect(data.status).toBe("pendingReview");
        expect(data.archived).toBe(false);
        expect(["unpaid", "pending"]).toContain(data.billing.paymentStatus);
    });

    it("flattens files into key-only refs on the dog + a top-level pdfFormRef", async () => {
        await createSubmission(payload());
        const data = fs.setDoc.mock.calls[0][1];
        expect(data.dog.dicomFilesRef).toEqual(["submissions/s1/dog1/dicom/a.dcm"]);
        expect(data.dog.supportingDocumentsRef).toEqual(["submissions/s1/dog1/supporting-documents/b.pdf"]);
        expect(data.pdfFormRef).toBe("submissions/s1/dog1/pdf-forms/c.pdf");
    });

    it("writes null (not undefined) for a missing registeredNumber / pdfForm, and deleteField for clinicInfo", async () => {
        await createSubmission({ ...payload(), files: makeFiles({ pdfForm: undefined }) });
        const data = fs.setDoc.mock.calls[0][1];
        expect(data.dog.registeredNumber).toBeNull();
        expect(data.pdfFormRef).toBeNull();
        expect(data.clinicInfo).toBe(DELETE_FIELD);
        expect(data.archivedAt).toBe(DELETE_FIELD);
    });

    it("keeps clinicInfo for clinic submissions", async () => {
        const clinicInfo = { clinicName: "Vet Co", contactName: "Dr A", email: "a@vet.co", phone: "+61 1" };
        await createSubmission({ ...payload(), submitterType: "clinic", clinicInfo });
        expect(fs.setDoc.mock.calls[0][1].clinicInfo).toEqual(clinicInfo);
    });

    it("writes to testSubmissions when asked", async () => {
        await createSubmission({ ...SAMPLE_TEST_SUBMISSION, s3SubmissionId: "t1" }, "testSubmissions");
        expect(fs.setDoc.mock.calls[0][0].path).toBe("testSubmissions/t1_dog0");
    });

    it("never writes a raw `files` field (keeps the draft's `files` intact via merge for cleanup-abandoned)", async () => {
        await createSubmission(payload());
        expect(fs.setDoc.mock.calls[0][1]).not.toHaveProperty("files");
    });
});

describe("admin status writes", () => {
    it("updateSubmissionStatus only touches status + updatedAt", async () => {
        await updateSubmissionStatus("s1_dog1", "reviewing");
        const [ref, data] = fs.updateDoc.mock.calls[0];
        expect(ref.path).toBe("submissions/s1_dog1");
        expect(Object.keys(data).sort()).toEqual(["status", "updatedAt"]);
        expect(data.status).toBe("reviewing");
    });

    it("archiveSubmission sets the archive fields only", async () => {
        await archiveSubmission("s1_dog1");
        const data = fs.updateDoc.mock.calls[0][1];
        expect(data).toMatchObject({ archived: true, archivedBy: "admin" });
        expect(data.archivedAt).toBeInstanceOf(Date);
        expect(Object.keys(data).sort()).toEqual(["archived", "archivedAt", "archivedBy", "updatedAt"]);
    });

    it("restoreSubmission clears the archive fields", async () => {
        await restoreSubmission("s1_dog1");
        const data = fs.updateDoc.mock.calls[0][1];
        expect(data).toMatchObject({ archived: false, archivedAt: DELETE_FIELD, archivedBy: "" });
    });

    it("none of the admin writes touch billing (only the Admin SDK may)", async () => {
        await updateSubmissionStatus("x", "completed");
        await archiveSubmission("x");
        await restoreSubmission("x");
        for (const [, data] of fs.updateDoc.mock.calls) {
            expect(Object.keys(data).some((k) => k.startsWith("billing"))).toBe(false);
        }
    });
});

describe("resetPassword", () => {
    it("passes straight through to Firebase", async () => {
        fs.sendPasswordResetEmail.mockResolvedValue(undefined);
        await resetPassword("a@b.com");
        expect(fs.sendPasswordResetEmail).toHaveBeenCalledWith({ name: "auth" }, "a@b.com");
    });
});

describe("getFirestoreErrorMessage", () => {
    it.each([
        ["permission-denied", 7, "You don't have permission"],
        ["unavailable", 14, "Unable to reach the database"],
        ["not-found", 5, "could not be found"],
        ["cancelled", 1, "was cancelled"],
        ["deadline-exceeded", 4, "took too long"],
    ])("maps both client code %s and Admin gRPC code %i", (stringCode, numericCode, fragment) => {
        expect(getFirestoreErrorMessage({ code: stringCode })).toContain(fragment);
        expect(getFirestoreErrorMessage({ code: numericCode })).toContain(fragment);
    });

    it("falls back to a generic message for unknown codes", () => {
        expect(getFirestoreErrorMessage({ code: "weird" })).toBe("Something went wrong loading data. Please try again.");
    });

    it("uses an Error's message when there's no code", () => {
        expect(getFirestoreErrorMessage(new Error("plain"))).toBe("plain");
        expect(getFirestoreErrorMessage("str")).toBe("Something went wrong loading data. Please try again.");
    });
});