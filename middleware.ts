// ========================================== //
// DELETE this file to turn on normal website //
// ========================================== //

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEV_ACCESS_COOKIE_NAME } from './lib/devAccess';

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
