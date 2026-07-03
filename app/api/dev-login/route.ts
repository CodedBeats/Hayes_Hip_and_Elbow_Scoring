import { NextRequest, NextResponse } from "next/server";
import { DEV_ACCESS_COOKIE_NAME } from "@/lib/devAccess";

export async function POST(req: NextRequest) {
    const { password } = await req.json();

    if (password !== process.env.DEV_ACCESS_PASSWORD) {
        return NextResponse.json({ success: false }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(DEV_ACCESS_COOKIE_NAME, password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
    });

    return response;
}

export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete(DEV_ACCESS_COOKIE_NAME);
    return response;
}
