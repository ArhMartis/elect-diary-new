import { NextResponse, NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Публичные страницы ---
  if (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // --- Проверяем сессию ---
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__secure_better-auth.session_token");

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

// ⚠️ matcher остаётся, но теперь это config proxy
export const config = {
  matcher: ["/:path*"],
};
