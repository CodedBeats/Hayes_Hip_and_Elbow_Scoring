import { describe, it, expect, vi, beforeEach } from "vitest";
import { jsonRequest, freshIp } from "../../helpers/requests";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/lib/resend", () => ({ resend: { emails: { send: mocks.send } } }));

const { POST } = await import("@/app/api/contact/route");

const valid = (overrides: Record<string, unknown> = {}) => ({
    name: "Jane Owner",
    email: "jane@gmail.com",
    message: "Hi, how long does scoring take?",
    company: "",
    elapsedMs: 15_000,
    ...overrides,
});

const post = (body: unknown, ip = freshIp()) =>
    POST(jsonRequest("/api/contact", { body, headers: { "x-forwarded-for": ip } }));

beforeEach(() => {
    mocks.send.mockReset().mockResolvedValue({ data: { id: "email_1" }, error: null });
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("POST /api/contact - happy path", () => {
    it("sends the practice notification + submitter confirmation", async () => {
        const res = await post(valid());
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ success: true });
        expect(mocks.send).toHaveBeenCalledTimes(2);

        const [notification] = mocks.send.mock.calls[0];
        expect(notification).toMatchObject({
            to: "practice@example.com",
            replyTo: "jane@gmail.com",
            subject: "New contact form message from Jane Owner",
        });
        expect(notification.from).toContain("@mail.hayes-hip-and-elbow-scoring.com");

        const [confirmation] = mocks.send.mock.calls[1];
        expect(confirmation).toMatchObject({ to: "jane@gmail.com", replyTo: "practice@example.com", subject: "We've received your message" });
    });
});

describe("POST /api/contact - bot heuristics (silent fake success)", () => {
    it.each([
        ["honeypot filled", { company: "Acme" }],
        ["too fast", { elapsedMs: 500 }],
        ["no timing (direct API POST)", { elapsedMs: undefined }],
    ])("returns 200 but sends nothing when %s", async (_label, overrides) => {
        const res = await post(valid(overrides));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ success: true });
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it("runs before rate limiting, so bots don't consume a real user's quota", async () => {
        const ip = freshIp();
        for (let i = 0; i < 10; i++) await post(valid({ company: "bot" }), ip);
        expect((await post(valid(), ip)).status).toBe(200);
        expect(mocks.send).toHaveBeenCalledTimes(2);
    });
});

describe("POST /api/contact - rate limit", () => {
    it("allows 5 messages per IP per minute, then 429s", async () => {
        const ip = freshIp();
        for (let i = 0; i < 5; i++) expect((await post(valid(), ip)).status).toBe(200);
        const res = await post(valid(), ip);
        expect(res.status).toBe(429);
        expect(res.headers.get("Retry-After")).toBeTruthy();
    });
});

describe("POST /api/contact - validation", () => {
    it("collects every field error at once", async () => {
        const res = await post(valid({ name: " ", email: "not-an-email", message: "" }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({
            errors: ["Please enter your name.", "Please enter a valid email address.", "Please enter a message."],
        });
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it("rejects over-length fields", async () => {
        const res = await post(valid({ message: "x".repeat(5001) }));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ errors: ["One of your fields is too long - please shorten it."] });
    });

    it("rejects disposable email addresses", async () => {
        const res = await post(valid({ email: "bot@mailinator.com" }));
        expect(res.status).toBe(400);
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it("500s (not crash) on a malformed body", async () => {
        const res = await POST(jsonRequest("/api/contact", { body: "{nope" }));
        expect(res.status).toBe(500);
    });
});

describe("POST /api/contact - profanity", () => {
    it("flags but still delivers a profane message", async () => {
        const res = await post(valid({ message: "this is shit service" }));
        expect(res.status).toBe(200);
        expect(mocks.send.mock.calls[0][0].subject).toMatch(/^\[⚠️ FLAGGED\]/);
        expect(mocks.send.mock.calls[0][0].text).toContain("this is shit service");
        // the submitter's confirmation is never flagged
        expect(mocks.send.mock.calls[1][0].subject).toBe("We've received your message");
    });

    it("checks the name field too", async () => {
        await post(valid({ name: "Shithead" }));
        expect(mocks.send.mock.calls[0][0].subject).toMatch(/^\[⚠️ FLAGGED\]/);
    });
});

describe("POST /api/contact - delivery failures", () => {
    it("500s when the practice notification is rejected by Resend's API", async () => {
        mocks.send
            .mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: "bad from" } })
            .mockResolvedValueOnce({ data: { id: "c" }, error: null });
        expect((await post(valid())).status).toBe(500);
    });

    it("500s when the notification call throws (network)", async () => {
        mocks.send.mockRejectedValueOnce(new Error("ECONNRESET")).mockResolvedValueOnce({ data: { id: "c" }, error: null });
        expect((await post(valid())).status).toBe(500);
    });

    it("still succeeds if only the confirmation fails - the practice got the lead", async () => {
        mocks.send
            .mockResolvedValueOnce({ data: { id: "n" }, error: null })
            .mockResolvedValueOnce({ data: null, error: { name: "bounce", message: "nope" } });
        const res = await post(valid());
        expect(res.status).toBe(200);
        expect(console.error).toHaveBeenCalled();
    });
});