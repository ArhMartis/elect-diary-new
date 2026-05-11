import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { session, user } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const sessionData = await auth.api.getSession({ headers: await headers() });
  if (!sessionData || sessionData.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const targetUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (targetUser.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const sessions = await db
    .select({
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    })
    .from(session)
    .where(eq(session.userId, userId))
    .orderBy(desc(session.createdAt))
    .limit(100);

  const u = targetUser[0];
  const lines: string[] = [];
  lines.push(`=== Лог активности пользователя ===`);
  lines.push(`Имя: ${u.fullName || u.name || "—"}`);
  lines.push(`Email: ${u.email || "—"}`);
  lines.push(`Роль: ${u.role || "—"}`);
  lines.push(`Класс: ${u.groupId || "—"}`);
  lines.push(`Забанен: ${u.banned ? "Да" : "Нет"}`);
  lines.push(``);
  lines.push(`=== Сессии (${sessions.length} последних) ===`);
  lines.push(``);

  for (const s of sessions) {
    lines.push(`--- Сессия ${s.id.substring(0, 8)}... ---`);
    lines.push(`  Создана:       ${s.createdAt ? new Date(s.createdAt).toLocaleString("ru-RU") : "—"}`);
    lines.push(`  Обновлена:     ${s.updatedAt ? new Date(s.updatedAt).toLocaleString("ru-RU") : "—"}`);
    lines.push(`  Истекает:      ${s.expiresAt ? new Date(s.expiresAt).toLocaleString("ru-RU") : "—"}`);
    lines.push(`  IP адрес:      ${s.ipAddress || "—"}`);
    lines.push(`  User-Agent:    ${s.userAgent || "—"}`);
    lines.push(``);
  }

  const content = lines.join("\n");
  const filename = `activity_${(u.fullName || u.email || "user").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}