import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    EMAIL_REGEX,
    FIELD_LIMITS,
    fieldsOverLimit,
    isDisposableEmail,
    containsProfanity,
    looksLikeBot,
    MIN_FILL_MS,
    rateLimit,
    getClientIp,
} from "@/lib/security";

describe("EMAIL_REGEX", () => {
    it.each(["a@b.co", "jane.doe+vet@clinic.com.au", "x@sub.domain.org"])("accepts %s", (email) => {
        expect(EMAIL_REGEX.test(email)).toBe(true);
    });

    it.each(["", "plain", "a@b", "@b.com", "a@.com ", "a b@c.com", "a@b c.com", "a@@b.com"])("rejects %j", (email) => {
        expect(EMAIL_REGEX.test(email)).toBe(false);
    });
});

describe("fieldsOverLimit", () => {
    const atLimit = {
        name: "n".repeat(FIELD_LIMITS.name),
        email: "e".repeat(FIELD_LIMITS.email),
        message: "m".repeat(FIELD_LIMITS.message),
    };

    it("allows every field exactly at its limit", () => {
        expect(fieldsOverLimit(atLimit)).toEqual([]);
    });

    it("flags each field one character over its limit", () => {
        expect(fieldsOverLimit({ ...atLimit, name: atLimit.name + "x" })).toEqual(["name"]);
        expect(fieldsOverLimit({ ...atLimit, email: atLimit.email + "x" })).toEqual(["email"]);
        expect(fieldsOverLimit({ ...atLimit, message: atLimit.message + "x" })).toEqual(["message"]);
    });

    it("reports multiple offending fields at once", () => {
        expect(fieldsOverLimit({ name: "n".repeat(101), email: "ok", message: "m".repeat(5001) })).toEqual(["name", "message"]);
    });

    it("measures trimmed length, so surrounding whitespace doesn't count", () => {
        expect(fieldsOverLimit({ ...atLimit, name: `   ${atLimit.name}   ` })).toEqual([]);
    });
});

describe("isDisposableEmail", () => {
    it("catches common throwaway providers", () => {
        expect(isDisposableEmail("bot@mailinator.com")).toBe(true);
    });

    it("is case- and whitespace-insensitive", () => {
        expect(isDisposableEmail("  Bot@MAILINATOR.com ")).toBe(true);
    });

    it("lets real providers through", () => {
        expect(isDisposableEmail("jane@gmail.com")).toBe(false);
        expect(isDisposableEmail("vet@clinic.com.au")).toBe(false);
    });

    it("returns false (not throw) for input with no domain", () => {
        expect(isDisposableEmail("no-at-sign")).toBe(false);
        expect(isDisposableEmail("")).toBe(false);
    });

    // Known gap: exact-domain lookup only, so a subdomain of a listed provider slips through.
    it.fails("catches subdomains of a listed disposable provider", () => {
        expect(isDisposableEmail("bot@inbox.mailinator.com")).toBe(true);
    });
});

describe("containsProfanity", () => {
    it("flags plain profanity", () => {
        expect(containsProfanity("this is fucking ridiculous")).toBe(true);
    });

    it("flags common obfuscation (leetspeak, symbols, stretched letters)", () => {
        expect(containsProfanity("sh1t service")).toBe(true);
        expect(containsProfanity("5hit")).toBe(true);
        expect(containsProfanity("f*ck")).toBe(true);
        expect(containsProfanity("fuuuuck")).toBe(true);
    });

    it("doesn't catch letter-spaced words (library limitation)", () => {
        expect(containsProfanity("f u c k this")).toBe(false);
    });

    it("doesn't flag ordinary radiograph language or Scunthorpe-style substrings", () => {
        expect(containsProfanity("My dog's hip dysplasia score and elbow radiographs, please.")).toBe(false);
        expect(containsProfanity("Scunthorpe, cocker spaniel, desexed male, assess the elbows")).toBe(false);
    });

    // These false positives are WHY profanity only flags the staff email and never blocks:
    // "bitch" is the correct term for a female dog, and the rest are routine for a vet
    // practice. If this ever changes to blocking, these cases have to be solved first.
    it.each(["Bitch, 3 years old", "my bitch whelped last week", "anal glands checked", "Dick Smith Veterinary"])(
        "flags legitimate vet language %j (accepted false positive)",
        (text) => {
            expect(containsProfanity(text)).toBe(true);
        },
    );
});

describe("looksLikeBot", () => {
    it("trips on a filled honeypot even with a human fill time", () => {
        expect(looksLikeBot({ honeypot: "Acme Pty Ltd", elapsedMs: 60_000 })).toBe(true);
    });

    it("ignores a whitespace-only honeypot", () => {
        expect(looksLikeBot({ honeypot: "   ", elapsedMs: 60_000 })).toBe(false);
    });

    it.each([undefined, null, "5000", NaN])("treats a missing/non-numeric elapsedMs (%s) as a bot", (elapsedMs) => {
        expect(looksLikeBot({ elapsedMs })).toBe(true);
    });

    it("uses MIN_FILL_MS as an inclusive human boundary", () => {
        expect(looksLikeBot({ elapsedMs: MIN_FILL_MS - 1 })).toBe(true);
        expect(looksLikeBot({ elapsedMs: MIN_FILL_MS })).toBe(false);
    });
});

describe("rateLimit", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("allows up to `limit` hits, then blocks", () => {
        const key = "rl:limit";
        for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60_000).ok).toBe(true);
        expect(rateLimit(key, 3, 60_000)).toEqual({ ok: false, retryAfterMs: 60_000 });
    });

    it("reports retryAfterMs as time until the oldest in-window hit expires", () => {
        const key = "rl:retry";
        rateLimit(key, 1, 60_000);
        vi.advanceTimersByTime(20_000);
        expect(rateLimit(key, 1, 60_000)).toEqual({ ok: false, retryAfterMs: 40_000 });
    });

    it("is a sliding window - old hits age out", () => {
        const key = "rl:slide";
        rateLimit(key, 2, 10_000);
        vi.advanceTimersByTime(6_000);
        rateLimit(key, 2, 10_000);
        expect(rateLimit(key, 2, 10_000).ok).toBe(false);
        // first hit (t=0) is now outside the window; the blocked hit at t=6000 still counts
        vi.advanceTimersByTime(4_001);
        expect(rateLimit(key, 2, 10_000).ok).toBe(false);
        vi.advanceTimersByTime(6_000);
        expect(rateLimit(key, 2, 10_000).ok).toBe(true);
    });

    it("keeps separate buckets per key", () => {
        rateLimit("rl:a", 1, 60_000);
        expect(rateLimit("rl:a", 1, 60_000).ok).toBe(false);
        expect(rateLimit("rl:b", 1, 60_000).ok).toBe(true);
    });

    it("defaults to 5 hits per minute", () => {
        const key = "rl:defaults";
        for (let i = 0; i < 5; i++) expect(rateLimit(key).ok).toBe(true);
        expect(rateLimit(key).ok).toBe(false);
        vi.advanceTimersByTime(60_001);
        expect(rateLimit(key).ok).toBe(true);
    });
});

describe("getClientIp", () => {
    const req = (headers: Record<string, string>) => new Request("http://x", { headers });

    it("takes the first (client) entry of an x-forwarded-for chain", () => {
        expect(getClientIp(req({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1, 10.0.0.2" }))).toBe("203.0.113.7");
    });

    it("falls back to x-real-ip", () => {
        expect(getClientIp(req({ "x-real-ip": " 198.51.100.4 " }))).toBe("198.51.100.4");
    });

    it("prefers x-forwarded-for over x-real-ip", () => {
        expect(getClientIp(req({ "x-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2" }))).toBe("1.1.1.1");
    });

    it("buckets header-less callers as 'unknown'", () => {
        expect(getClientIp(req({}))).toBe("unknown");
    });
});