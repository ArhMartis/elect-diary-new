import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { grades, subjects, user, academicPeriods } from "@/db/schema/auth_schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * API: GET /api/grades
 *
 * Получение оценок ученика
 *
 * Query параметры:
 * - studentId: string - ID ученика
 * - academicPeriodId?: number - ID четверти (опционально)
 * - startDate?: string - начало периода (YYYY-MM-DD)
 * - endDate?: string - конец периода (YYYY-MM-DD)
 *
 * Таблицы:
 * - grades (id, studentId, subjectId, teacherId, value, date, comment, academicPeriodId, createdAt)
 * - subjects (id, name)
 * - user (id, full_name)
 * - academicPeriods (id, name, startDate, endDate)
 *
 * @returns Array<{
 *   id: number,
 *   studentId: string,
 *   subjectId: number,
 *   subjectName: string,
 *   teacherId: string,
 *   teacherName: string,
 *   value: string,
 *   date: string,
 *   comment: string | null,
 *   academicPeriodId: number | null,
 *   academicPeriodName: string | null,
 *   createdAt: number | null
 * }>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const academicPeriodId = searchParams.get("academicPeriodId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!studentId) {
      return NextResponse.json({ error: "Не указан studentId" }, { status: 400 });
    }

    // Формируем условие WHERE
    const conditions: (ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lte>)[] = [
      eq(grades.studentId, studentId),
    ];

    if (academicPeriodId) {
      conditions.push(eq(grades.academicPeriodId, parseInt(academicPeriodId)));
    }

    if (startDate && endDate) {
      conditions.push(gte(grades.date, startDate));
      conditions.push(lte(grades.date, endDate));
    }

    const whereCondition = and(...conditions);

    // Получаем оценки с связанными данными
    const gradesList = await db
      .select({
        id: grades.id,
        studentId: grades.studentId,
        subjectId: grades.subjectId,
        subjectName: subjects.name,
        teacherId: grades.teacherId,
        teacherName: user.fullName,
        value: grades.value,
        date: grades.date,
        comment: grades.comment,
        academicPeriodId: grades.academicPeriodId,
        academicPeriodName: academicPeriods.name,
        createdAt: grades.createdAt,
      })
      .from(grades)
      .leftJoin(subjects, eq(grades.subjectId, subjects.id))
      .leftJoin(user, eq(grades.teacherId, user.id))
      .leftJoin(academicPeriods, eq(grades.academicPeriodId, academicPeriods.id))
      .where(whereCondition)
      .orderBy(grades.date);

    return NextResponse.json(gradesList);
  } catch (error) {
    console.error("Ошибка при получении оценок:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/grades
 * 
 * Добавление новой оценки
 * 
 * Body:
 * - studentId: string
 * - subjectId: number
 * - teacherId: string
 * - value: string (5, 4, 3, 2, Н)
 * - date: string (YYYY-MM-DD)
 * - comment?: string
 * - academicPeriodId?: number
 * 
 * Таблица: grades
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, subjectId, teacherId, value, date, comment, academicPeriodId } = body;

    // Валидация обязательных полей
    if (!studentId || !subjectId || !teacherId || !value || !date) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // Проверяем, нет ли уже оценки у этого ученика по этому предмету за эту дату
    const existingGrade = await db.query.grades.findFirst({
      where: and(
        eq(grades.studentId, studentId),
        eq(grades.subjectId, subjectId),
        eq(grades.date, date)
      ),
    });

    if (existingGrade) {
      return NextResponse.json(
        { error: "Оценка уже существует. Используйте PUT для обновления." },
        { status: 409 }
      );
    }

    // Вставляем новую оценку
    const [newGrade] = await db
      .insert(grades)
      .values({
        studentId,
        subjectId,
        teacherId,
        value,
        date,
        comment: comment || null,
        academicPeriodId: academicPeriodId || null,
      })
      .returning();

    return NextResponse.json(newGrade, { status: 201 });
  } catch (error) {
    console.error("Ошибка при добавлении оценки:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: PUT /api/grades
 * 
 * Обновление оценки
 * 
 * Body:
 * - id: number
 * - value?: string
 * - comment?: string
 * - date?: string
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, value, comment, date, academicPeriodId } = body;

    if (!id) {
      return NextResponse.json({ error: "Не указан ID оценки" }, { status: 400 });
    }

    // Обновляем оценку
    const [updatedGrade] = await db
      .update(grades)
      .set({
        value: value,
        comment: comment,
        date: date,
        academicPeriodId: academicPeriodId,
      })
      .where(eq(grades.id, id))
      .returning();

    return NextResponse.json(updatedGrade);
  } catch (error) {
    console.error("Ошибка при обновлении оценки:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: DELETE /api/grades
 * 
 * Удаление оценки
 * 
 * Body:
 * - id: number
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Не указан ID оценки" }, { status: 400 });
    }

    await db.delete(grades).where(eq(grades.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении оценки:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
