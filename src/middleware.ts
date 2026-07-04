import { NextRequest, NextResponse } from "next/server";
import { verifySessionFromToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const ROLE_HOME: Record<string, string> = {
  TEACHER: "/teacher",
  SHOON: "/shoon",
  ADMIN: "/admin",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/shoon") ||
    pathname.startsWith("/admin");

  const isAuthPage = pathname === "/login" || pathname === "/register";

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  let session = null;
  if (token) {
    try {
      session = await verifySessionFromToken(token);
    } catch {
      session = null;
    }
  }

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isProtected && session) {
    const allowedRoot = ROLE_HOME[session.role];
    if (allowedRoot && !pathname.startsWith(allowedRoot)) {
      return NextResponse.redirect(new URL(allowedRoot, req.url));
    }
  }

  if (isAuthPage && session) {
    const home = ROLE_HOME[session.role] || "/";
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/teacher/:path*",
    "/shoon/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
