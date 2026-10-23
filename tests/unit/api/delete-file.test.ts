import { describe, it, expect, vi, beforeEach } from "vitest";
import { jsonRequest } from "../../helpers/requests";

const mocks = vi.hoisted(() => ({ deleteObjects: vi.fn() }));
vi.mock("@/lib/s3", () => ({ deleteObjects: mocks.deleteObjects }));

const { DELETE } = await import("@/app/api/delete-file/route");

const del = (body: unknown) => DELETE(jsonRequest("/api/delete-file", { method: "DELETE", body }));

beforeEach(() => {
    mocks.deleteObjects.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("DELETE /api/delete-file", () => {
    it.each([
        [{ key: "submissions/abc/dog1/dicom/x.dcm" }],
        [{ submissionId: "abc" }],
        [{ submissionId: "", key: "submissions//x" }],
        [{}],
    ])("400s when submissionId or key is missing: %j", async (body) => {
        const res = await del(body);
        expect(res.status).toBe(400);
        expect(mocks.deleteObjects).not.toHaveBeenCalled();
    });

    it.each([
        // another submission's file
        ["abc", "submissions/xyz/dog1/dicom/x.dcm"],
        // prefix near-miss: "abc" must not match "abcd"
        ["abc", "submissions/abcd/dog1/dicom/x.dcm"],
        // outside the submissions/ tree entirely
        ["abc", "other/abc/secret.txt"],
        ["abc", "abc/dog1/x.dcm"],
    ])("refuses to delete a key outside submissions/%s/: %s", async (submissionId, key) => {
        const res = await del({ submissionId, key });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: "key does not belong to submissionId" });
        expect(mocks.deleteObjects).not.toHaveBeenCalled();
    });

    it("deletes exactly the one key when it's scoped to the submission", async () => {
        const key = "submissions/abc/dog1/dicom/x.dcm";
        const res = await del({ submissionId: "abc", key });
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ success: true });
        expect(mocks.deleteObjects).toHaveBeenCalledWith([key]);
    });

    it("500s when S3 fails", async () => {
        mocks.deleteObjects.mockRejectedValue(new Error("AccessDenied"));
        const res = await del({ submissionId: "abc", key: "submissions/abc/x" });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: "Failed to delete file" });
    });

    it("500s on a malformed body", async () => {
        expect((await del("{nope")).status).toBe(500);
    });
});