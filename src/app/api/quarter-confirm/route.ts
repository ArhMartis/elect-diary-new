import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quarterConfirmations } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const academicYear = searchParams.get("academicYear");

    if (!groupId || !academicYear) {
      return NextResponse.json({ error: "groupId и academicYear обязательны" }, { status: 400 });
    }

    const rows = await db.select().from(quarterConfirmations).where(
      and(eq(quarterConfirmations.groupId, parseInt(groupId)), eq(quarterConfirmations.academicYear, academicYear))
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching quarter confirmations:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const body = await request.json();
    const { groupId, quarter, academicYear, confirmType } = body;

    if (!groupId || !quarter || !academicYear || !confirmType) {
      return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
    }

    const existing = await db.select().from(quarterConfirmations).where(
      and(eq(quarterConfirmations.groupId, groupId), eq(quarterConfirmations.quarter, quarter), eq(quarterConfirmations.academicYear, academicYear))
    );

    if (confirmType === "teacher") {
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ error: "Нет прав" }, { status: 403 });
      }

      if (existing.length > 0) {
        await db.update(quarterConfirmations)
          .set({ confirmedByTeacher: session.user.fullName || session.user.name || "", confirmedByTeacherAt: new Date() })
          .where(eq(quarterConfirmations.id, existing[0].id));
      } else {
        await db.insert(quarterConfirmations).values({
          groupId,
          quarter,
          academicYear,
          confirmedByTeacher: session.user.fullName || session.user.name || "",
          confirmedByTeacherAt: new Date(),
        });
      }
    } else if (confirmType === "parent") {
      if (session.user.role !== "parent" && session.user.role !== "admin") {
        return NextResponse.json({ error: "Нет прав" }, { status: 403 });
      }

      if (existing.length > 0) {
        await db.update(quarterConfirmations)
          .set({ confirmedByParent: session.user.fullName || session.user.name || "", confirmedByParentAt: new Date() })
          .where(eq(quarterConfirmations.id, existing[0].id));
      } else {
        await db.insert(quarterConfirmations).values({
          groupId,
          quarter,
          academicYear,
          confirmedByParent: session.user.fullName || session.user.name || "",
          confirmedByParentAt: new Date(),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error confirming quarter:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}