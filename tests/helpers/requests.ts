import { NextRequest } from "next/server";

const BASE_URL = "http://localhost:3000";

/**
 * Builds a JSON `NextRequest` for calling a route handler directly.
 *
 * @remarks
 * `NextRequest` rather than plain `Request` since some handlers read `req.nextUrl`; it's a
 * subclass, so it works for handlers typed as `Request` too. `body` is stringified unless
 * it's already a string, which lets a test send deliberately malformed JSON.
 */
export const jsonRequest = (
    path: string,
    { method = "POST", body, headers = {} }: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
) =>
    new NextRequest(`${BASE_URL}${path}`, {
        method,
        headers: { "content-type": "application/json", ...headers },
        body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });

export const getRequest = (path: string, headers: Record<string, string> = {}) =>
    new NextRequest(`${BASE_URL}${path}`, { method: "GET", headers });

/** A unique fake client IP per call, so the module-level rate limiter never bleeds between tests. */
let ipCounter = 0;
export const freshIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;