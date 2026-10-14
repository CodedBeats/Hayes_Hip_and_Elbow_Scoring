import disposableEmailDomains from "disposable-email-domains";
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

/**
 * Shape check for an email address - not RFC-complete, just "looks like an address".
 *
 * @remarks
 * Single source of truth for the client form and the `/api/contact` route, which
 * previously each carried their own copy of this literal.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Per-field character caps for the public contact form.
 *
 * @remarks
 * Rejected server-side before anything reaches Resend or the practice inbox - a
 * bot padding a field to megabytes shouldn't cost us a send or a mailbox. `email`
 * is the RFC 5321 maximum length of an address.
 */
export const FIELD_LIMITS = {
    name: 100,
    email: 254,
    message: 5000,
} as const;

/**
 * Returns the fields whose trimmed length exceeds {@link FIELD_LIMITS}.
 *
 * @returns Array of offending field names; empty when everything is within limits.
 */
export function fieldsOverLimit(fields: { name: string; email: string; message: string }): string[] {
    return (Object.keys(FIELD_LIMITS) as (keyof typeof FIELD_LIMITS)[]).filter(
        (key) => fields[key].trim().length > FIELD_LIMITS[key],
    );
}

// --- Disposable email -------------------------------------------------------

/** Domains from the `disposable-email-domains` list, lower-cased, for O(1) lookup. */
const DISPOSABLE_DOMAINS = new Set(disposableEmailDomains.map((domain) => domain.toLowerCase()));

/**
 * Whether an email address belongs to a known throwaway / temporary-inbox provider.
 *
 * @remarks
 * A blocklist, so inherently a little stale - it catches the common providers
 * (Mailinator, guerrillamail, 10minutemail, ...) but not a brand-new one. Used to
 * reject contact submissions we could never actually reply to; the same guard
 * belongs on `owner.email` / `clinicInfo.email` once submission-confirmation
 * emails ship, so those don't bounce.
 */
export function isDisposableEmail(email: string): boolean {
    const domain = email.trim().toLowerCase().split("@")[1];
    if (!domain) return false;
    return DISPOSABLE_DOMAINS.has(domain);
}

// --- Profanity -------------------------------------------------------------

/**
 * Obscenity matcher built once at module load.
 *
 * @remarks
 * The "recommended transformers" normalise common obfuscation (leetspeak, spaced
 * letters, confusable unicode) before matching, which is what makes this better
 * than a plain word-list scan.
 * @see {@link https://github.com/jo3-l/obscenity}
 */
const profanityMatcher = new RegExpMatcher({
    ...englishDataset.build(),
    ...englishRecommendedTransformers,
});

/**
 * Whether the text contains profanity per the module's obscenity matcher.
 *
 * @remarks
 * Contact submissions are *flagged* on a hit, not blocked - profanity filters
 * have false positives (place names, anatomy - relevant for a vet practice) and a
 * genuinely upset customer shouldn't be silenced. The staff notification email
 * carries the flag instead.
 */
export function containsProfanity(text: string): boolean {
    return profanityMatcher.hasMatch(text);
}

// --- Bot heuristics -------------------------------------------------------

/**
 * Minimum plausible time (ms) for a human to fill the 3-field contact form.
 * Submissions faster than this are treated as automated.
 */
export const MIN_FILL_MS = 3000;

/**
 * Cheap, no-CAPTCHA bot signals for the contact form.
 *
 * @remarks
 * Takes the hidden `company` honeypot value (real users never see the field, so
 * any non-empty string means a script filled every input) and the client-measured
 * `elapsedMs` between form mount and submit (missing, from a direct API POST, or
 * implausibly small both count as suspicious). `elapsedMs` is client-supplied and
 * spoofable - this stops bots that don't bother, not a determined one. Callers
 * should fail *silently* (fake 200) on a hit so the trap isn't obvious.
 */
export function looksLikeBot({ honeypot, elapsedMs }: { honeypot?: unknown; elapsedMs?: unknown }): boolean {
    if (typeof honeypot === "string" && honeypot.trim().length > 0) return true;
    if (typeof elapsedMs !== "number" || Number.isNaN(elapsedMs)) return true;
    return elapsedMs < MIN_FILL_MS;
}

// --- Rate limiting -------------------------------------------------------

/**
 * Hit timestamps (ms) per key, most-recent-last. Module scope = process memory.
 *
 * @remarks
 * On Vercel this is per-instance and cleared on cold start, so it throttles one
 * client hammering a warm instance but not a distributed flood or one that spans
 * a redeploy. The durable upgrade is a shared store (Upstash Redis +
 * `@upstash/ratelimit`) behind the same {@link rateLimit} signature.
 */
const rateLimitHits = new Map<string, number[]>();

export interface RateLimitResult {
    ok: boolean;
    /** Ms until the oldest in-window hit expires; 0 when `ok`. */
    retryAfterMs: number;
}

/**
 * Sliding-window rate limit check. Records the current call as a hit.
 *
 * @param key - client identifier, typically an IP (see {@link getClientIp}).
 * @param limit - max hits allowed within the window.
 * @param windowMs - window length in ms.
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
    const now = Date.now();
    const cutoff = now - windowMs;

    const recent = (rateLimitHits.get(key) ?? []).filter((ts) => ts > cutoff);
    recent.push(now);
    rateLimitHits.set(key, recent);

    if (recent.length <= limit) {
        return { ok: true, retryAfterMs: 0 };
    }
    return { ok: false, retryAfterMs: recent[0] + windowMs - now };
}

/**
 * Best-effort client IP from proxy headers.
 *
 * @remarks
 * Vercel sets `x-forwarded-for` to a comma-separated chain with the real client
 * first. Falls back to `"unknown"`, which buckets all header-less callers
 * together - acceptable for a coarse abuse limiter.
 */
export function getClientIp(req: Request): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0].trim();
    return req.headers.get("x-real-ip")?.trim() || "unknown";
}
