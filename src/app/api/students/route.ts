import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";

/**
 * API: GET /api/students?classId={id}
 * 
 * Возвращает список учеников указанного класса
 * 
 * Таблица: users WHERE groupId = ? AND role = 'student'
 * 
 * Query параметры:
 * - classId: number - ID класса
 * 
 * @returns Array<{ id: string, fullName: string, email: string, groupId: number | null }>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "Не указан classId" },
        { status: 400 }
      );
    }

    const students = await db
      .select()
      .from(user)
      .where(
        and(
          eq(user.groupId, parseInt(classId)),
          eq(user.role, "student")
        )
      );

    return NextResponse.json(students);
  } catch (error) {
    console.error("Ошибка при получении учеников:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
