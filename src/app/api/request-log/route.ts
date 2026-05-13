import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requestLog } from "@/db/schema/request_log";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const sessionData = await auth.api.getSession({ headers: await headers() });
    if (!sessionData?.user?.id) {
      return NextResponse.json({ ok: true });
    }

    const body = await request.json().catch(() => ({}));
    const { path, method, statusCode } = body;

    if (!path) {
      return NextResponse.json({ ok: true });
    }

    await db.insert(requestLog).values({
      userId: sessionData.user.id,
      method: (method || "GET").substring(0, 10),
      path: String(path).substring(0, 500),
      statusCode: statusCode ? Number(statusCode) : null,
      userAgent: request.headers.get("user-agent")?.substring(0, 500) || null,
      ipAddress: (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null),
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: true });
  }
}