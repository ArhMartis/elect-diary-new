import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { teacherComments } from "@/db/schema/diary-extra";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * API: GET /api/teacher-comments
 * 
 * Получение замечаний учителей об ученике
 * 
 * Query параметры:
 * - studentId: string - ID ученика
 * - teacherId?: string - ID учителя (опционально)
 * 
 * Таблица: teacher_comments (создать отдельно!)
 * Структура таблицы:
 * CREATE TABLE teacher_comments (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   studentId TEXT NOT NULL,
 *   teacherId TEXT NOT NULL,
 *   teacherName TEXT,
 *   comment TEXT NOT NULL,
 *   date TEXT DEFAULT CURRENT_DATE,
 *   FOREIGN KEY (studentId) REFERENCES user(id) ON DELETE CASCADE,
 *   FOREIGN KEY (teacherId) REFERENCES user(id) ON DELETE CASCADE
 * )
 * 
 * @returns Array<{
 *   id: number,
 *   teacherId: string,
 *   teacherName: string,
 *   comment: string,
 *   date: string
 * }>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const teacherId = searchParams.get("teacherId");

    if (!studentId) {
      return NextResponse.json({ error: "Не указан studentId" }, { status: 400 });
    }

    const conditions = [eq(teacherComments.studentId, studentId)];
    
    if (teacherId) {
      conditions.push(eq(teacherComments.teacherId, teacherId));
    }

    const comments = await db
      .select({
        id: teacherComments.id,
        teacherId: teacherComments.teacherId,
        teacherName: teacherComments.teacherName,
        comment: teacherComments.comment,
        date: teacherComments.date,
      })
      .from(teacherComments)
      .where(and(...conditions))
      .orderBy(desc(teacherComments.date));

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Ошибка при получении замечаний учителей:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/teacher-comments
 * 
 * Добавление замечания учителя
 * 
 * Body:
 * - studentId: string
 * - teacherId: string
 * - teacherName?: string
 * - comment: string
 * - date?: string (YYYY-MM-DD, по умолчанию сегодня)
 * 
 * Таблица: teacher_comments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, teacherId, teacherName, comment, date } = body;

    if (!studentId || !teacherId || !comment) {
      return NextResponse.json(
        { error: "studentId, teacherId и comment обязательны" },
        { status: 400 }
      );
    }

    await db.insert(teacherComments).values({
      studentId,
      teacherId,
      teacherName,
      comment,
      date: date ? new Date(date) : new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при добавлении замечания учителя:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: DELETE /api/teacher-comments
 * 
 * Удаление замечания
 * 
 * Body:
 * - id: number
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, studentId, clearAll } = body;

    if (clearAll) {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user || session.user.role !== "admin") {
        return NextResponse.json({ error: "Только для администратора" }, { status: 403 });
      }
      if (!studentId) {
        return NextResponse.json({ error: "Не указан studentId" }, { status: 400 });
      }
      await db.delete(teacherComments).where(eq(teacherComments.studentId, studentId));
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: "Не указан ID замечания" }, { status: 400 });
    }

    await db.delete(teacherComments).where(eq(teacherComments.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении замечания:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
