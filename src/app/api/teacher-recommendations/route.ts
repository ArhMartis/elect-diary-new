import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { teacherRecommendations } from "@/db/schema/diary-extra";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Не указан studentId" }, { status: 400 });
    }

    const records = await db
      .select()
      .from(teacherRecommendations)
      .where(eq(teacherRecommendations.studentId, studentId))
      .orderBy(teacherRecommendations.createdAt);

    return NextResponse.json(records);
  } catch (error) {
    console.error("Ошибка при получении рекомендаций:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, content, academicYear } = body;

    if (!studentId || !content?.trim()) {
      return NextResponse.json({ error: "Заполните все обязательные поля" }, { status: 400 });
    }

    const newRecord = await db.insert(teacherRecommendations).values({
      studentId,
      academicYear: academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      content: content.trim(),
      teacherId: session.user.id,
    }).returning();

    return NextResponse.json(newRecord[0]);
  } catch (error) {
    console.error("Ошибка при сохранении рекомендации:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, studentId } = body;

    if (id) {
      const record = await db.query.teacherRecommendations.findFirst({ where: eq(teacherRecommendations.id, id) });
      if (!record) {
        return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
      }
      if (session.user.role !== "admin" && record.teacherId !== session.user.id) {
        return NextResponse.json({ error: "Нет прав на удаление" }, { status: 403 });
      }
      await db.delete(teacherRecommendations).where(eq(teacherRecommendations.id, id));
      return NextResponse.json({ success: true });
    }

    if (studentId && session.user.role === "admin") {
      await db.delete(teacherRecommendations).where(eq(teacherRecommendations.studentId, studentId));
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ error: "Укажите id или studentId" }, { status: 400 });
  } catch (error) {
    console.error("Ошибка при удалении:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
