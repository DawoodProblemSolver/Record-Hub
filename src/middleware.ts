import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_record_hub_super_secret_key_2026";
const secretKey = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = "record_hub_auth_token";

// Protected path prefixes
const PROTECTED_PATHS = [
  "/dashboard",
  "/attendance",
  "/students",
  "/classes",
  "/history",
  "/reports",
  "/ai-assistant",
  "/settings",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (!isProtected) {
    // If user is already logged in and navigates to /login, redirect to /dashboard
    if (pathname === "/login") {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (token) {
        try {
          await jwtVerify(token, secretKey);
          return NextResponse.redirect(new URL("/dashboard", request.url));
        } catch {
          // Token invalid, allow /login
        }
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, secretKey);
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/attendance/:path*",
    "/students/:path*",
    "/classes/:path*",
    "/history/:path*",
    "/reports/:path*",
    "/ai-assistant/:path*",
    "/settings/:path*",
    "/login",
  ],
};
