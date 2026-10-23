import { describe, it, expect, afterAll } from "vitest";
import { jsonRequest } from "../helpers/requests";
import { getFileMetadata, getFileDownloadUrl, enrichUploadedFile, deleteObjects } from "@/lib/s3";
import { POST as uploadUrl } from "@/app/api/upload-url/route";
import { DELETE as deleteFile } from "@/app/api/delete-file/route";
import type { UploadUrlResponse } from "@/types/upload";

/**
 * Live S3 round trip against the real bucket - proves the rotated AWS key works and that
 * its IAM policy covers every action the app uses (presigned PUT, HEAD, presigned GET,
 * DeleteObjects).
 *
 * @remarks
 * Writes a few bytes under `submissions/vitest-<uuid>/`, deleted at the end of the
 * round trip and again in afterAll as a safety net.
 */

const hasEnv = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME);
const submissionId = `vitest-${crypto.randomUUID()}`;
const payload = new TextEncoder().encode(`vitest smoke ${submissionId}`);
const createdKeys: string[] = [];

afterAll(async () => {
    if (createdKeys.length) await deleteObjects(createdKeys).catch(() => {});
});

describe.skipIf(!hasEnv)("S3 round trip (live)", () => {
    let key = "";

    it("upload-url presigns a PUT under this submission's prefix", async () => {
        const res = await uploadUrl(jsonRequest("/api/upload-url", {
            body: { submissionId, files: [{ fileName: "smoke.dcm", contentType: "application/dicom", dogIndex: 1, category: "dicom" }] },
        }));
        expect(res.status).toBe(200);
        const body: UploadUrlResponse = await res.json();
        key = body.urls[0].key;
        createdKeys.push(key);
        expect(key.startsWith(`submissions/${submissionId}/dog1/dicom/`)).toBe(true);

        // the browser's direct-to-S3 PUT, minus the browser
        const put = await fetch(body.urls[0].uploadUrl, { method: "PUT", headers: { "Content-Type": "application/dicom" }, body: payload });
        expect(put.status, await put.text()).toBe(200);
    });

    it("getFileMetadata (HEAD) sees the object with the right size + type", async () => {
        const meta = await getFileMetadata(key);
        expect(meta).not.toBeNull();
        expect(meta!.size).toBe(payload.byteLength);
        expect(meta!.contentType).toBe("application/dicom");
        expect(Date.now() - meta!.uploadedAt.getTime()).toBeLessThan(10 * 60_000);
    });

    it("getFileDownloadUrl (presigned GET) returns the exact bytes", async () => {
        const res = await fetch(await getFileDownloadUrl(key));
        expect(res.status).toBe(200);
        expect(new Uint8Array(await res.arrayBuffer())).toEqual(payload);
    });

    it("enrichUploadedFile backfills metadata + a working URL", async () => {
        const enriched = await enrichUploadedFile({ key, fileName: "smoke.dcm", size: 0, contentType: "", uploadedAt: new Date(0) });
        expect(enriched.size).toBe(payload.byteLength);
        expect(enriched.url).toMatch(/^https:\/\//);
    });

    it("a PUT with a tampered signature is rejected by S3", async () => {
        const res = await uploadUrl(jsonRequest("/api/upload-url", {
            body: { submissionId, files: [{ fileName: "tamper.dcm", contentType: "application/dicom", dogIndex: 1, category: "dicom" }] },
        }));
        const { urls }: UploadUrlResponse = await res.json();
        const tampered = urls[0].uploadUrl.replace(/X-Amz-Signature=[0-9a-f]{4}/, "X-Amz-Signature=0000");
        const put = await fetch(tampered, { method: "PUT", headers: { "Content-Type": "application/dicom" }, body: payload });
        expect(put.status).toBe(403);
        createdKeys.push(urls[0].key);
    });

    it("delete-file removes it, after which HEAD reports it gone", async () => {
        const res = await deleteFile(jsonRequest("/api/delete-file", { method: "DELETE", body: { submissionId, key } }));
        expect(res.status).toBe(200);
        expect(await getFileMetadata(key)).toBeNull();
    });
});