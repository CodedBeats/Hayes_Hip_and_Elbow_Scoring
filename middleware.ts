// ========================================== //
// DELETE this file to turn on normal website //
// ========================================== //

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEV_ACCESS_COOKIE_NAME } from './lib/devAccess';

/**
 * Pre-launch gate: redirects every request to `/pre-launch` unless a valid dev-access
 * cookie is present.
 *
 * @remarks
 * `/pre-launch` and `/api/*` are always let through - the former so the gate page
 * itself (and its login form) isn't redirected in a loop, the latter so API routes keep
 * working during pre-launch (they have no UI to gate). Delete this file entirely once
 * the site is ready to go public - see the header comment above this file for that
 * instruction; there's no separate feature flag to flip.
 */
export const middleware = (request: NextRequest) => {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/pre-launch') || pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    const hasDevAccess = request.cookies.get(DEV_ACCESS_COOKIE_NAME)?.value === process.env.DEV_ACCESS_PASSWORD;

    // un-comment for pre-launch
    if (!hasDevAccess) return NextResponse.redirect(new URL('/pre-launch', request.url));
}

export const config = {
    // Excludes Next.js internals and static files so they are never intercepted
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)'],
};
