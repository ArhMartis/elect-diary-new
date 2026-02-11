// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
// Better Auth по умолчанию использует это имя куки для сессии
const sessionCookie =
request.cookies.get("better-auth.session_token") ||
request.cookies.get("__secure_better-auth.session_token");

const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in") ||
                   request.nextUrl.pathname.startsWith("/sign-up");

if (!sessionCookie && !isAuthPage) {
    // Если сессии нет и мы не на странице входа — редирект на вход
    return NextResponse.redirect(new URL("/sign-in", request.url));
}

if (sessionCookie && isAuthPage) {
    // Если сессия есть и мы ломимся на страницу входа — редирект в дашборд
    return NextResponse.redirect(new URL("/dashboard", request.url));
}

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/profile/:path*", "/sign-in", "/sign-up"],
};
