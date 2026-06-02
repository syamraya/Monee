// middleware.ts
// Letakkan file ini di ROOT project (sejajar dengan folder app/)

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // ── Belum login → redirect ke sign-in ─────────────────────────
  if (!token) {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/dashboard")
    ) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    return NextResponse.next();
  }

  const isAdmin = token.role === "ADMIN";

  // ── Akses /admin tapi bukan ADMIN → ke /dashboard ─────────────
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ── Akses /dashboard tapi ADMIN → ke /admin ───────────────────
  if (pathname.startsWith("/dashboard") && isAdmin) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};