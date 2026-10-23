import { describe, it, expect, vi, beforeEach } from "vitest";
import { jsonRequest } from "../../helpers/requests";
import { createFakeFirestore } from "../../helpers/fakeFirestore";
import type { UploadUrlResponse } from "@/types/upload";

// Real presigning (offline, dummy creds) - wrapped in a spy so tests can assert whether
// signing happened at all.
const presign = vi.hoisted(() => ({ spy: undefined as unknown as ReturnType<typeof vi.fn> }));
vi.mock("@aws-sdk/s3-request-presigner", async (importOriginal) => {
    const original = await importOriginal<typeof import("@aws-sdk/s3-request-presigner")>();
    presign.spy = vi.fn(original.getSignedUrl);
    return { getSignedUrl: presign.spy };
});

// For the key-format contract test against lib/firebaseAdmin's filename parsing.
const fake = vi.hoisted(() => ({ current: undefined as ReturnType<typeof createFakeFirestore> | undefined }));
vi.mock("firebase-admin/app", () => ({ cert: vi.fn(), getApps: () => [], getApp: vi.fn(), initializeApp: vi.fn(() => ({})) }));
vi.mock("firebase-admin/firestore", async (importOriginal) => ({
    ...(await importOriginal<typeof import("firebase-admin/firestore")>()),
    getFirestore: () => fake.current!.db,
}));
vi.mock("@/lib/firebase", () => ({}));

const { POST } = await import("@/app/api/upload-url/route");
const { getSubmissionById } = await import("@/lib/firebaseAdmin");

const file = (overrides: Record<string, unknown> = {}) => ({
    fileName: "hip.dcm",
    contentType: "application/dicom",
    dogIndex: 1,
    category: "dicom",
    ...overrides,
});

const post = (body: unknown) => POST(jsonRequest("/api/upload-url", { body }));

beforeEach(() => {
    presign.spy.mockClear();
    // getAdminDb() caches the first handle it sees, so reuse one fake and just clear it
    fake.current ??= createFakeFirestore();
    fake.current.docs.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/upload-url - category rules", () => {
    it.each([
        ["dicom", "hip.dcm", "application/dicom"],
        ["dicom", "HIP.DCM", "application/dicom"],
        // browsers often send no MIME type for .dcm - extension alone must be enough
        ["dicom", "hip.dcm", "application/octet-stream"],
        ["dicom", "extensionless", "application/dicom"],
        ["supporting-documents", "pedigree.pdf", "application/pdf"],
        ["supporting-documents", "pedigree.JPG", "image/jpeg"],
        ["supporting-documents", "pedigree.jpeg", "image/jpeg"],
        ["supporting-documents", "pedigree.png", "image/png"],
        ["pdf-forms", "form.pdf", "application/pdf"],
        ["pdf-forms", "signed-photo.png", "image/png"],
    ])("accepts %s: %s (%s)", async (category, fileName, contentType) => {
        const res = await post({ files: [file({ category, fileName, contentType })] });
        expect(res.status).toBe(200);
    });

    it.each([
        ["dicom", "hip.pdf", "application/pdf"],
        ["dicom", "hip.dcm.exe", "application/octet-stream"],
        ["supporting-documents", "notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        ["pdf-forms", "hip.dcm", "application/dicom"],
        ["pdf-forms", "evil.html", "text/html"],
    ])("rejects %s: %s (%s)", async (category, fileName, contentType) => {
        const res = await post({ files: [file({ category, fileName, contentType })] });
        expect(res.status).toBe(400);
        const { errors } = await res.json();
        expect(errors[0]).toContain(`"${fileName}" is not valid for category "${category}"`);
    });

    it("rejects an unknown category", async () => {
        const res = await post({ files: [file({ category: "../../etc" })] });
        expect(res.status).toBe(400);
        expect((await res.json()).errors).toEqual([`Invalid category "../../etc" for file "hip.dcm"`]);
    });
});

describe("POST /api/upload-url - request validation", () => {
    it.each([[undefined], [[]], ["not-an-array"]])("400s when files is %j", async (files) => {
        const res = await post({ files });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "files must be a non-empty array" });
    });

    it.each([0, -1, undefined, null])("rejects dogIndex %s", async (dogIndex) => {
        const res = await post({ files: [file({ dogIndex })] });
        expect(res.status).toBe(400);
    });

    it("requires fileName and contentType", async () => {
        const res = await post({ files: [file({ fileName: "" }), file({ contentType: undefined })] });
        expect((await res.json()).errors).toEqual([
            "Each file must have fileName and contentType",
            "Each file must have fileName and contentType",
        ]);
    });

    it("validates the whole batch before signing anything - one bad file fails them all", async () => {
        const res = await post({ files: [file(), file({ fileName: "bad.exe", contentType: "x" }), file()] });
        expect(res.status).toBe(400);
        expect((await res.json()).errors).toHaveLength(1);
        expect(presign.spy).not.toHaveBeenCalled();
    });

    it("500s on a malformed body without leaking details", async () => {
        const res = await post("{nope");
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: "Failed to generate upload URL" });
    });

    // Bug #5: no integer/type check, so these produce odd keys like `dog1.5` / `dogabc`.
    it.fails.each([1.5, "abc", "1"])("rejects a non-integer dogIndex (%j)", async (dogIndex) => {
        const res = await post({ files: [file({ dogIndex })] });
        expect(res.status).toBe(400);
    });
});

describe("POST /api/upload-url - presigned URLs", () => {
    it("keys files as submissions/{id}/dog{n}/{category}/{uuid}-{fileName}, in request order", async () => {
        const res = await post({
            submissionId: "sub-123",
            files: [file({ fileName: "form.pdf", category: "pdf-forms", contentType: "application/pdf" }), file({ dogIndex: 2 })],
        });
        const body: UploadUrlResponse = await res.json();
        expect(body.submissionId).toBe("sub-123");
        expect(body.urls.map((u) => u.fileName)).toEqual(["form.pdf", "hip.dcm"]);
        expect(body.urls[0].key).toMatch(/^submissions\/sub-123\/dog1\/pdf-forms\/[0-9a-f-]{36}-form\.pdf$/);
        expect(body.urls[1].key).toMatch(/^submissions\/sub-123\/dog2\/dicom\/[0-9a-f-]{36}-hip\.dcm$/);
    });

    it("generates a fresh submissionId when none is given", async () => {
        const body: UploadUrlResponse = await (await post({ files: [file()] })).json();
        expect(body.submissionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it("gives every file a unique key, even with identical names", async () => {
        const body: UploadUrlResponse = await (await post({ files: [file(), file()] })).json();
        expect(body.urls[0].key).not.toBe(body.urls[1].key);
    });

    it("presigns a 5-minute PUT bound to the declared content type", async () => {
        const body: UploadUrlResponse = await (await post({ files: [file()] })).json();
        const url = new URL(body.urls[0].uploadUrl);
        expect(url.hostname).toContain("unit-test-bucket");
        expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
        expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain("host");
        expect(presign.spy.mock.calls[0][1].input).toMatchObject({ Bucket: "unit-test-bucket", ContentType: "application/dicom" });
    });

    // The key format here is re-parsed by keyToUploadedFileStub (lib/firebaseAdmin.ts) to
    // show filenames on the admin dashboard - this pins the two together.
    it.each(["hip.dcm", "Left Elbow (2).dcm", "0f8fad5b-looks-like-uuid.dcm"])(
        "contract: a generated key for %j parses back to the original filename",
        async (fileName) => {
            const body: UploadUrlResponse = await (await post({ files: [file({ fileName })] })).json();
            fake.current!.docs.set("submissions/x", { status: "pendingReview", billing: {}, pdfFormRef: body.urls[0].key });
            expect((await getSubmissionById("x"))!.files.pdfForm?.fileName).toBe(fileName);
        },
    );

    // Bug #5: a "/" in the name adds key segments, so the dashboard shows the wrong name.
    it.fails("contract: a filename containing '/' survives the round trip", async () => {
        const body: UploadUrlResponse = await (await post({ files: [file({ fileName: "scans/hip.dcm" })] })).json();
        fake.current!.docs.set("submissions/x", { status: "pendingReview", billing: {}, pdfFormRef: body.urls[0].key });
        expect((await getSubmissionById("x"))!.files.pdfForm?.fileName).toBe("scans/hip.dcm");
    });
});