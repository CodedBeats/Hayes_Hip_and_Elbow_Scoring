import { describe, it, expect, vi } from "vitest";
import { DeleteObjectsCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { s3, collectFileKeys, deleteObjects, getFileMetadata, getFileDownloadUrl, enrichUploadedFile } from "@/lib/s3";
import { makeFiles, makeUploadedFile } from "../../helpers/fixtures";
import type { Files } from "@/types/submission";

describe("collectFileKeys", () => {
    it("flattens every category, pdfForm last", () => {
        expect(collectFileKeys(makeFiles())).toEqual([
            "submissions/s1/dog1/dicom/a.dcm",
            "submissions/s1/dog1/supporting-documents/b.pdf",
            "submissions/s1/dog1/pdf-forms/c.pdf",
        ]);
    });

    it("handles a missing pdfForm and empty arrays", () => {
        expect(collectFileKeys({ dicomFiles: [], supportingDocuments: [] })).toEqual([]);
    });

    // Bug #2 (part): the crons cast `docSnap.data().files ?? {}` to Files, so a doc with
    // no `files` field reaches here as `{}` - and this throws, aborting the whole cron run.
    it.fails("tolerates a doc with no files at all (the `files ?? {}` fallback in the cron queries)", () => {
        expect(collectFileKeys({} as Files)).toEqual([]);
    });
});

describe("deleteObjects", () => {
    it("makes no S3 call for an empty list", async () => {
        const send = vi.spyOn(s3, "send");
        await deleteObjects([]);
        expect(send).not.toHaveBeenCalled();
    });

    it("sends one DeleteObjectsCommand for the bucket", async () => {
        const send = vi.spyOn(s3, "send").mockResolvedValue({} as never);
        await deleteObjects(["k1", "k2"]);
        expect(send).toHaveBeenCalledTimes(1);
        const command = send.mock.calls[0][0] as DeleteObjectsCommand;
        expect(command).toBeInstanceOf(DeleteObjectsCommand);
        expect(command.input).toEqual({
            Bucket: "unit-test-bucket",
            Delete: { Objects: [{ Key: "k1" }, { Key: "k2" }] },
        });
    });

    it("propagates S3 failures", async () => {
        vi.spyOn(s3, "send").mockRejectedValue(new Error("AccessDenied") as never);
        await expect(deleteObjects(["k"])).rejects.toThrow("AccessDenied");
    });
});

describe("getFileMetadata", () => {
    it("maps HeadObject output", async () => {
        const lastModified = new Date("2026-02-02T00:00:00Z");
        const send = vi.spyOn(s3, "send").mockResolvedValue({ ContentLength: 2048, ContentType: "application/dicom", LastModified: lastModified } as never);
        expect(await getFileMetadata("k")).toEqual({ size: 2048, contentType: "application/dicom", uploadedAt: lastModified });
        expect((send.mock.calls[0][0] as HeadObjectCommand).input).toEqual({ Bucket: "unit-test-bucket", Key: "k" });
    });

    it("fills defaults for sparse metadata", async () => {
        vi.spyOn(s3, "send").mockResolvedValue({} as never);
        expect(await getFileMetadata("k")).toEqual({ size: 0, contentType: "application/octet-stream", uploadedAt: new Date(0) });
    });

    it("returns null rather than throwing when the object is gone", async () => {
        vi.spyOn(s3, "send").mockRejectedValue(Object.assign(new Error("NotFound"), { name: "NotFound" }) as never);
        expect(await getFileMetadata("k")).toBeNull();
    });
});

describe("getFileDownloadUrl", () => {
    // Real SigV4 presigning - runs fully offline with the dummy credentials from setup.ts.
    it("presigns a 30-minute GET for the right bucket + key", async () => {
        const url = new URL(await getFileDownloadUrl("submissions/s1/dog1/dicom/a b.dcm"));
        expect(url.hostname).toContain("unit-test-bucket");
        expect(decodeURIComponent(url.pathname)).toBe("/submissions/s1/dog1/dicom/a b.dcm");
        expect(url.searchParams.get("X-Amz-Expires")).toBe("1800");
        expect(url.searchParams.get("X-Amz-Credential")).toContain("AKIAUNITTESTDUMMY000");
        expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    });
});

describe("enrichUploadedFile", () => {
    const stub = makeUploadedFile("submissions/s1/dog1/dicom/a.dcm", { size: 0, contentType: "", url: undefined });

    it("merges real metadata and a download URL onto the stub", async () => {
        const lastModified = new Date("2026-02-02T00:00:00Z");
        vi.spyOn(s3, "send").mockResolvedValue({ ContentLength: 10, ContentType: "application/dicom", LastModified: lastModified } as never);
        const enriched = await enrichUploadedFile(stub);
        expect(enriched).toMatchObject({ key: stub.key, fileName: stub.fileName, size: 10, contentType: "application/dicom", uploadedAt: lastModified });
        expect(enriched.url).toMatch(/^https:\/\//);
    });

    it("returns the stub unchanged (url undefined = 'unavailable') when the object is missing", async () => {
        vi.spyOn(s3, "send").mockRejectedValue(new Error("NotFound") as never);
        expect(await enrichUploadedFile(stub)).toBe(stub);
    });
});