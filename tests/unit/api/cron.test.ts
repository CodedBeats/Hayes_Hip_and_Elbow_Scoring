import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRequest } from "../../helpers/requests";
import { makeFiles } from "../../helpers/fixtures";
import type { Files } from "@/types/submission";

// Both cron routes share the same shape (auth -> query -> S3 delete -> doc delete), so
// they're tested together off one table.

const calls = vi.hoisted(() => [] as string[]);
const mocks = vi.hoisted(() => ({
    getStaleDraftSubmissions: vi.fn(),
    getStaleUnpaidSubmissions: vi.fn(),
    deleteSubmissionDoc: vi.fn(),
    deleteObjects: vi.fn(),
}));

vi.mock("@/lib/firebaseAdmin", () => ({
    getStaleDraftSubmissions: mocks.getStaleDraftSubmissions,
    getStaleUnpaidSubmissions: mocks.getStaleUnpaidSubmissions,
    deleteSubmissionDoc: mocks.deleteSubmissionDoc,
}));
// real collectFileKeys, mocked network call
vi.mock("@/lib/s3", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/s3")>()),
    deleteObjects: mocks.deleteObjects,
}));

const drafts = await import("@/app/api/cron/cleanup-drafts/route");
const abandoned = await import("@/app/api/cron/cleanup-abandoned/route");

const NOW = new Date("2026-06-15T03:00:00Z");
const SEVEN_DAYS_AGO = new Date("2026-06-08T03:00:00Z");

const authed = (path: string) => getRequest(path, { authorization: "Bearer unit-cron-secret" });

const routes = [
    { name: "cleanup-drafts", path: "/api/cron/cleanup-drafts", GET: drafts.GET, query: mocks.getStaleDraftSubmissions },
    { name: "cleanup-abandoned", path: "/api/cron/cleanup-abandoned", GET: abandoned.GET, query: mocks.getStaleUnpaidSubmissions },
];

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    calls.length = 0;
    for (const m of Object.values(mocks)) m.mockReset();
    mocks.getStaleDraftSubmissions.mockResolvedValue([]);
    mocks.getStaleUnpaidSubmissions.mockResolvedValue([]);
    mocks.deleteObjects.mockImplementation(async (keys: string[]) => {
        calls.push(`s3:${keys.join("|")}`);
    });
    mocks.deleteSubmissionDoc.mockImplementation(async (id: string) => {
        calls.push(`doc:${id}`);
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
    vi.useRealTimers();
});

describe.each(routes)("GET /api/cron/$name", ({ path, GET, query }) => {
    it.each([
        ["no header", {}],
        ["wrong secret", { authorization: "Bearer guess" }],
        ["non-bearer scheme", { authorization: "unit-cron-secret" }],
        ["empty bearer", { authorization: "Bearer " }],
    ])("401s with %s and never queries", async (_label, headers) => {
        const res = await GET(getRequest(path, headers));
        expect(res.status).toBe(401);
        expect(query).not.toHaveBeenCalled();
    });

    // Bug #1: if CRON_SECRET is ever missing from the Vercel env, the expected header
    // becomes the literal string "Bearer undefined" - which anyone can send.
    it.fails("401s 'Bearer undefined' when CRON_SECRET is unset (fails closed)", async () => {
        vi.stubEnv("CRON_SECRET", undefined);
        const res = await GET(getRequest(path, { authorization: "Bearer undefined" }));
        expect(res.status).toBe(401);
    });

    it("queries with a cutoff exactly 7 days ago", async () => {
        await GET(authed(path));
        expect(query).toHaveBeenCalledWith(SEVEN_DAYS_AGO);
    });

    it("returns an empty result when nothing is stale", async () => {
        const res = await GET(authed(path));
        expect(await res.json()).toEqual({ deletedCount: 0, deletedIds: [] });
        expect(mocks.deleteObjects).not.toHaveBeenCalled();
    });

    it("deletes each doc's S3 files BEFORE its Firestore doc", async () => {
        query.mockResolvedValue([
            { id: "a_dog1", files: makeFiles() },
            { id: "b_dog1", files: { dicomFiles: [], supportingDocuments: [] } satisfies Files },
        ]);
        const res = await GET(authed(path));
        expect(calls).toEqual([
            "s3:submissions/s1/dog1/dicom/a.dcm|submissions/s1/dog1/supporting-documents/b.pdf|submissions/s1/dog1/pdf-forms/c.pdf",
            "doc:a_dog1",
            "s3:",
            "doc:b_dog1",
        ]);
        expect(await res.json()).toEqual({ deletedCount: 2, deletedIds: ["a_dog1", "b_dog1"] });
    });

    it("keeps the Firestore doc if its S3 delete fails (safe ordering)", async () => {
        query.mockResolvedValue([{ id: "a_dog1", files: makeFiles() }]);
        mocks.deleteObjects.mockRejectedValue(new Error("AccessDenied"));
        await expect(GET(authed(path))).rejects.toThrow();
        expect(mocks.deleteSubmissionDoc).not.toHaveBeenCalled();
    });

    // Bug #2: no per-item error handling - one bad doc (an S3 error, or a doc with no
    // `files` field) throws out of the loop, so every later doc waits another day and the
    // response never reports what was already deleted.
    it.fails("keeps going past one failing doc and still cleans up the rest", async () => {
        query.mockResolvedValue([
            { id: "bad_dog1", files: makeFiles() },
            { id: "good_dog1", files: makeFiles() },
        ]);
        mocks.deleteObjects.mockRejectedValueOnce(new Error("SlowDown"));
        const res = await GET(authed(path));
        expect(mocks.deleteSubmissionDoc).toHaveBeenCalledWith("good_dog1");
        expect(res.status).toBe(200);
    });

    it.fails("skips (doesn't crash on) a stale doc with no files field", async () => {
        query.mockResolvedValue([
            { id: "nofiles_dog1", files: {} as Files },
            { id: "good_dog1", files: makeFiles() },
        ]);
        const res = await GET(authed(path));
        expect(res.status).toBe(200);
        expect(mocks.deleteSubmissionDoc).toHaveBeenCalledWith("good_dog1");
    });
});