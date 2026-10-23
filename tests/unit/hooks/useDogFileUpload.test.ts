// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { FakeXhr } from "../../helpers/fakeXhr";
import { makeUploadedFile } from "../../helpers/fixtures";
import type { Files } from "@/types/submission";

const mocks = vi.hoisted(() => ({ saveDraftFiles: vi.fn() }));
vi.mock("@/lib/firebase", () => ({ saveDraftFiles: mocks.saveDraftFiles }));

const { useDogFileUpload, EMPTY_UPLOADED_NAMES } = await import("@/hooks/useDogFileUpload");

const calls: string[] = [];
const fetchMock = vi.fn();

const pdf = new File(["%PDF"], "form.pdf", { type: "application/pdf" });
const dcm1 = new File(["d1"], "hip.dcm", { type: "" });
const dcm2 = new File(["d2"], "elbow.dcm", { type: "" });
const doc1 = new File(["p"], "pedigree.pdf", { type: "application/pdf" });

/** Fakes /api/upload-url by echoing back one URL per requested file, in order. */
const uploadUrlResponder = async (_url: string, init: RequestInit) => {
    const { files } = JSON.parse(init.body as string);
    return {
        ok: true,
        json: async () => ({
            submissionId: "sub1",
            urls: files.map((f: { fileName: string; category: string }, i: number) => ({
                uploadUrl: `https://s3.test/put/${i}`,
                key: `submissions/sub1/dog1/${f.category}/uuid${i}-${f.fileName}`,
                fileName: f.fileName,
            })),
        }),
    };
};

const render = (initialUploadedFiles: Files | null = null, initialUploadedNames = EMPTY_UPLOADED_NAMES) =>
    renderHook(() => useDogFileUpload({ submissionId: "sub1", dogIndex: 1, initialUploadedFiles, initialUploadedNames }));

beforeEach(() => {
    calls.length = 0;
    FakeXhr.reset();
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    fetchMock.mockReset().mockImplementation(async (url: string, init: RequestInit) => {
        calls.push(`fetch:${url}`);
        if (url === "/api/upload-url") return uploadUrlResponder(url, init);
        return { ok: true, json: async () => ({ success: true }) };
    });
    vi.stubGlobal("fetch", fetchMock);
    mocks.saveDraftFiles.mockReset().mockImplementation(async () => {
        calls.push("saveDraftFiles");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useDogFileUpload - handleUploadAll", () => {
    it("refuses to upload with nothing selected", async () => {
        const { result } = render();
        await act(() => result.current.handleUploadAll());
        expect(result.current.uploadError).toBe("Select at least one file before uploading.");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("requests URLs in pdf -> dicom -> docs order with MIME fallbacks for blank types", async () => {
        const { result } = render();
        act(() => {
            result.current.setPdfFormFile(pdf);
            result.current.setSelectedDicom([dcm1, dcm2]);
            result.current.setSelectedDocs([doc1]);
        });
        await act(() => result.current.handleUploadAll());

        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body).toEqual({
            submissionId: "sub1",
            files: [
                { fileName: "form.pdf", contentType: "application/pdf", dogIndex: 1, category: "pdf-forms" },
                { fileName: "hip.dcm", contentType: "application/dicom", dogIndex: 1, category: "dicom" },
                { fileName: "elbow.dcm", contentType: "application/dicom", dogIndex: 1, category: "dicom" },
                { fileName: "pedigree.pdf", contentType: "application/pdf", dogIndex: 1, category: "supporting-documents" },
            ],
        });
        // each file PUT to its own presigned URL, in the same order
        expect(FakeXhr.instances.map((x) => [x.method, x.url, (x.body as File).name])).toEqual([
            ["PUT", "https://s3.test/put/0", "form.pdf"],
            ["PUT", "https://s3.test/put/1", "hip.dcm"],
            ["PUT", "https://s3.test/put/2", "elbow.dcm"],
            ["PUT", "https://s3.test/put/3", "pedigree.pdf"],
        ]);
    });

    it("slices results back into the right Files fields (the fragile offset logic)", async () => {
        const { result } = render();
        act(() => {
            result.current.setPdfFormFile(pdf);
            result.current.setSelectedDicom([dcm1, dcm2]);
            result.current.setSelectedDocs([doc1]);
        });
        await act(() => result.current.handleUploadAll());

        const files = result.current.uploadedFiles!;
        expect(files.pdfForm?.key).toBe("submissions/sub1/dog1/pdf-forms/uuid0-form.pdf");
        expect(files.dicomFiles.map((f) => f.key)).toEqual([
            "submissions/sub1/dog1/dicom/uuid1-hip.dcm",
            "submissions/sub1/dog1/dicom/uuid2-elbow.dcm",
        ]);
        expect(files.supportingDocuments.map((f) => f.key)).toEqual(["submissions/sub1/dog1/supporting-documents/uuid3-pedigree.pdf"]);
        expect(mocks.saveDraftFiles).toHaveBeenCalledWith("sub1", 1, files);
    });

    it("slices correctly with no pdf selected (offset 0)", async () => {
        const { result } = render();
        act(() => {
            result.current.setSelectedDicom([dcm1]);
            result.current.setSelectedDocs([doc1]);
        });
        await act(() => result.current.handleUploadAll());

        const files = result.current.uploadedFiles!;
        expect(files.pdfForm).toBeUndefined();
        expect(files.dicomFiles.map((f) => f.fileName)).toEqual(["hip.dcm"]);
        expect(files.supportingDocuments.map((f) => f.fileName)).toEqual(["pedigree.pdf"]);
    });

    it("merges a new batch onto previously uploaded files, keeping the old pdfForm if none is new", async () => {
        const existing: Files = {
            dicomFiles: [makeUploadedFile("submissions/sub1/dog1/dicom/old.dcm")],
            supportingDocuments: [],
            pdfForm: makeUploadedFile("submissions/sub1/dog1/pdf-forms/old.pdf"),
        };
        const { result } = render(existing);
        act(() => result.current.setSelectedDicom([dcm1]));
        await act(() => result.current.handleUploadAll());

        const files = result.current.uploadedFiles!;
        expect(files.pdfForm?.key).toBe("submissions/sub1/dog1/pdf-forms/old.pdf");
        expect(files.dicomFiles.map((f) => f.key)).toEqual([
            "submissions/sub1/dog1/dicom/old.dcm",
            "submissions/sub1/dog1/dicom/uuid0-hip.dcm",
        ]);
    });

    it("clears the selection, records names and bumps uploadKey after success", async () => {
        const { result } = render();
        act(() => {
            result.current.setPdfFormFile(pdf);
            result.current.setSelectedDicom([dcm1]);
        });
        await act(() => result.current.handleUploadAll());

        expect(result.current.selectedDicom).toEqual([]);
        expect(result.current.pdfFormFile).toBeNull();
        expect(result.current.uploadKey).toBe(1);
        expect(result.current.uploadedNames).toEqual({ dicom: ["hip.dcm"], docs: [], pdfForm: ["form.pdf"] });
        expect(result.current.isUploading).toBe(false);
        expect(result.current.uploadError).toBeNull();
    });

    it("keeps the uploaded files but warns visibly if the Firestore draft sync fails", async () => {
        mocks.saveDraftFiles.mockRejectedValue(new Error("permission-denied"));
        const { result } = render();
        act(() => result.current.setSelectedDicom([dcm1]));
        await act(() => result.current.handleUploadAll());

        expect(result.current.uploadedFiles?.dicomFiles).toHaveLength(1);
        expect(result.current.uploadError).toMatch(/^Your files uploaded, but we couldn't link them/);
    });

    it("surfaces server validation errors and uploads nothing", async () => {
        fetchMock.mockResolvedValue({ ok: false, json: async () => ({ errors: ['"x.exe" is not valid', '"y.exe" is not valid'] }) });
        const { result } = render();
        act(() => result.current.setSelectedDicom([dcm1]));
        await act(() => result.current.handleUploadAll());

        expect(result.current.uploadError).toBe('"x.exe" is not valid, "y.exe" is not valid');
        expect(FakeXhr.instances).toHaveLength(0);
        expect(mocks.saveDraftFiles).not.toHaveBeenCalled();
    });

    it("doesn't record a draft when any S3 PUT fails", async () => {
        FakeXhr.statusFor = (url) => (url.endsWith("/1") ? 403 : 200);
        const { result } = render();
        act(() => result.current.setSelectedDicom([dcm1, dcm2]));
        await act(() => result.current.handleUploadAll());

        expect(result.current.uploadError).toBe("Upload failed for elbow.dcm");
        expect(mocks.saveDraftFiles).not.toHaveBeenCalled();
        expect(result.current.uploadedFiles).toBeNull();
        expect(result.current.isUploading).toBe(false);
    });

    it("treats a network error on PUT as a failure too", async () => {
        FakeXhr.statusFor = () => 0;
        const { result } = render();
        act(() => result.current.setSelectedDicom([dcm1]));
        await act(() => result.current.handleUploadAll());
        expect(result.current.uploadError).toBe("Upload failed for hip.dcm");
    });
});

describe("useDogFileUpload - handleDeleteFile", () => {
    const existing = (): Files => ({
        dicomFiles: [
            makeUploadedFile("submissions/sub1/dog1/dicom/u1-hip.dcm", { fileName: "hip.dcm" }),
            makeUploadedFile("submissions/sub1/dog1/dicom/u2-elbow.dcm", { fileName: "elbow.dcm" }),
        ],
        supportingDocuments: [],
        pdfForm: makeUploadedFile("submissions/sub1/dog1/pdf-forms/u3-form.pdf", { fileName: "form.pdf" }),
    });
    const names = { dicom: ["hip.dcm", "elbow.dcm"], docs: [], pdfForm: ["form.pdf"] };

    it("updates Firestore BEFORE deleting from S3, then un-flags the name", async () => {
        const { result } = render(existing(), names);
        const target = existing().dicomFiles[0];
        await act(() => result.current.handleDeleteFile("dicomFiles", target));

        expect(calls).toEqual(["saveDraftFiles", "fetch:/api/delete-file"]);
        expect(mocks.saveDraftFiles.mock.calls[0][2].dicomFiles.map((f: { key: string }) => f.key)).toEqual(["submissions/sub1/dog1/dicom/u2-elbow.dcm"]);
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ submissionId: "sub1", key: target.key });
        expect(result.current.uploadedFiles?.dicomFiles).toHaveLength(1);
        expect(result.current.uploadedNames.dicom).toEqual(["elbow.dcm"]);
    });

    it("clears the pdfForm slot when deleting the form", async () => {
        const { result } = render(existing(), names);
        await act(() => result.current.handleDeleteFile("pdfForm", existing().pdfForm!));
        expect(mocks.saveDraftFiles.mock.calls[0][2].pdfForm).toBeUndefined();
        expect(result.current.uploadedNames.pdfForm).toEqual([]);
    });

    it("aborts entirely - no S3 delete, no local change - if the Firestore write is rejected", async () => {
        mocks.saveDraftFiles.mockRejectedValue(new Error("permission-denied"));
        const { result } = render(existing(), names);
        await act(() => result.current.handleDeleteFile("dicomFiles", existing().dicomFiles[0]));

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.current.uploadedFiles?.dicomFiles).toHaveLength(2);
        expect(result.current.uploadError).toBe("Couldn't remove this file from your submission. Please try again.");
    });

    it("still drops the file locally if only the S3 delete fails (worst case: orphaned storage)", async () => {
        fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Failed to delete file" }) });
        const { result } = render(existing(), names);
        await act(() => result.current.handleDeleteFile("dicomFiles", existing().dicomFiles[0]));

        expect(result.current.uploadedFiles?.dicomFiles).toHaveLength(1);
        expect(result.current.uploadError).toBeNull();
        expect(console.error).toHaveBeenCalled();
    });

    it("is a no-op when nothing has been uploaded yet", async () => {
        const { result } = render(null);
        await act(() => result.current.handleDeleteFile("dicomFiles", existing().dicomFiles[0]));
        expect(mocks.saveDraftFiles).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
    });
});