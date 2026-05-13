import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requestLog } from "@/db/schema/request_log";
import { session, user } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const sessionData = await auth.api.getSession({ headers: await headers() });
  if (!sessionData || sessionData.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const targetUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (targetUser.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const u = targetUser[0];

  const logs = await db
    .select()
    .from(requestLog)
    .where(eq(requestLog.userId, userId))
    .orderBy(desc(requestLog.createdAt))
    .limit(500);

  const sessions = await db
    .select()
    .from(session)
    .where(eq(session.userId, userId))
    .orderBy(desc(session.createdAt))
    .limit(50);

  const pad = (s: string, len: number) => s.padEnd(len);
  const lpad = (s: string, len: number) => s.padStart(len);

  const statusColor = (code: number | null) => {
    if (!code) return "—";
    if (code >= 200 && code < 300) return `${code} OK`;
    if (code >= 300 && code < 400) return `${code} REDIR`;
    if (code >= 400 && code < 500) return `${code} ERR`;
    return `${code} SVR`;
  };

  const lines: string[] = [];
  lines.push("╔══════════════════════════════════════════════════════════════╗");
  lines.push("║          ЖУРНАЛ АКТИВНОСТИ ПОЛЬЗОВАТЕЛЯ                     ║");
  lines.push("╚══════════════════════════════════════════════════════════════╝");
  lines.push("");
  lines.push(`  Имя:              ${u.fullName || u.name || "—"}`);
  lines.push(`  Email:             ${u.email || "—"}`);
  lines.push(`  Роль:              ${u.role || "—"}`);
  lines.push(`  Класс:             ${u.groupId || "—"}`);
  lines.push(`  Забанен:           ${u.banned ? "Да" : "Нет"}`);
  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("  СЕССИИ АВТОРИЗАЦИИ");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");

  if (sessions.length === 0) {
    lines.push("  (нет данных о сессиях)");
  } else {
    lines.push(`  ${pad("ВРЕМЯ СОЗДАНИЯ", 22)} ${pad("ОБНОВЛЕНО", 22)} ${pad("IP АДРЕС", 18)} УСТРОЙСТВО`);
    lines.push(`  ${"─".repeat(22)} ${"─".repeat(22)} ${"─".repeat(18)} ${"─".repeat(30)}`);
    for (const s of sessions) {
      const created = s.createdAt ? new Date(s.createdAt).toLocaleString("ru-RU") : "—";
      const updated = s.updatedAt ? new Date(s.updatedAt).toLocaleString("ru-RU") : "—";
      const ip = (s.ipAddress || "—").substring(0, 18);
      const ua = (s.userAgent || "—").substring(0, 50);
      lines.push(`  ${pad(created, 22)} ${pad(updated, 22)} ${pad(ip, 18)} ${ua}`);
    }
  }

  lines.push("");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("  ЗАПРОСЫ К СЕРВЕРУ");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");

  if (logs.length === 0) {
    lines.push("  (логи запросов отсутствуют — данные собираются с текущего момента)");
  } else {
    lines.push(`  ${pad("ВРЕМЯ", 22)} ${lpad("СТАТУС", 8)} ${pad("МЕТОД", 7)} ПУТЬ`);
    lines.push(`  ${"─".repeat(22)} ${"─".repeat(8)} ${"─".repeat(7)} ${"─".repeat(40)}`);
    for (const log of logs) {
      const time = log.createdAt ? new Date(log.createdAt).toLocaleString("ru-RU") : "—";
      const status = statusColor(log.statusCode);
      const method = (log.method || "—").padEnd(7);
      const path = (log.path || "/").substring(0, 50);
      lines.push(`  ${pad(time, 22)} ${lpad(status, 8)} ${method} ${path}`);
    }
  }

  lines.push("");
  lines.push(`  Всего логов: ${logs.length} | Сессий: ${sessions.length}`);
  lines.push(`  Отчёт сформирован: ${new Date().toLocaleString("ru-RU")}`);

  const content = lines.join("\n");
  const filename = `activity_${(u.fullName || u.email || "user").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  });
}