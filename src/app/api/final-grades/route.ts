import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * API: GET /api/final-grades
 * 
 * Получение итоговых оценок ученика
 * 
 * Query параметры:
 * - studentId: string - ID ученика
 * - academicYear?: string - учебный год
 * 
 * Таблица: final_grades (создать отдельно!)
 * Структура таблицы:
 * CREATE TABLE final_grades (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   studentId TEXT NOT NULL,
 *   subjectId INTEGER NOT NULL,
 *   academicYear TEXT NOT NULL,
 *   q1 TEXT,
 *   q2 TEXT,
 *   q3 TEXT,
 *   q4 TEXT,
 *   year TEXT,
 *   exam TEXT,
 *   final TEXT,
 *   FOREIGN KEY (studentId) REFERENCES user(id) ON DELETE CASCADE,
 *   FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
 * )
 * 
 * @returns Array<{
 *   subjectId: number,
 *   subjectName: string,
 *   q1: string,
 *   q2: string,
 *   q3: string,
 *   q4: string,
 *   year: string,
 *   exam: string,
 *   final: string
 * }>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const academicYear = searchParams.get("academicYear");

    if (!studentId) {
      return NextResponse.json({ error: "Не указан studentId" }, { status: 400 });
    }

    // TODO: Создать таблицу final_grades и раскомментировать код
    /*
    const finalGrades = await db
      .select({
        subjectId: finalGrades.subjectId,
        subjectName: subjects.name,
        q1: finalGrades.q1,
        q2: finalGrades.q2,
        q3: finalGrades.q3,
        q4: finalGrades.q4,
        year: finalGrades.year,
        exam: finalGrades.exam,
        final: finalGrades.final,
      })
      .from(finalGrades)
      .leftJoin(subjects, eq(finalGrades.subjectId, subjects.id))
      .where(
        and(
          eq(finalGrades.studentId, studentId),
          academicYear ? eq(finalGrades.academicYear, academicYear) : undefined
        )
      );

    return NextResponse.json(finalGrades);
    */

    console.log("[API] GET /api/final-grades", { studentId, academicYear });
    console.log("[DB] SELECT * FROM final_grades WHERE studentId = ?", studentId);

    // Возвращаем заглушку
    return NextResponse.json([]);
  } catch (error) {
    console.error("Ошибка при получении итоговых оценок:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/final-grades
 * 
 * Сохранение итоговых оценок
 * 
 * Body:
 * - studentId: string
 * - subjectId: number
 * - academicYear: string
 * - q1?: string
 * - q2?: string
 * - q3?: string
 * - q4?: string
 * - year?: string
 * - exam?: string
 * - final?: string
 * 
 * Таблица: final_grades
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, subjectId, academicYear, q1, q2, q3, q4, year, exam, final } = body;

    if (!studentId || !subjectId || !academicYear) {
      return NextResponse.json(
        { error: "studentId, subjectId и academicYear обязательны" },
        { status: 400 }
      );
    }

    // TODO: Создать таблицу final_grades и раскомментировать код
    /*
    const existing = await db.query.finalGrades.findFirst({
      where: and(
        eq(finalGrades.studentId, studentId),
        eq(finalGrades.subjectId, subjectId),
        eq(finalGrades.academicYear, academicYear)
      ),
    });

    if (existing) {
      await db
        .update(finalGrades)
        .set({ q1, q2, q3, q4, year, exam, final })
        .where(eq(finalGrades.id, existing.id));
    } else {
      await db.insert(finalGrades).values({
        studentId,
        subjectId,
        academicYear,
        q1,
        q2,
        q3,
        q4,
        year,
        exam,
        final,
      });
    }
    */

    console.log("[API] POST /api/final-grades", body);
    console.log("[DB] INSERT OR REPLACE INTO final_grades (...) VALUES (...)");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении итоговых оценок:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: PUT /api/final-grades
 * 
 * Массовое обновление итоговых оценок
 * 
 * Body:
 * - studentId: string
 * - academicYear: string
 * - grades: Array<{ subjectId: number, q1?: string, q2?: string, ... }>
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, academicYear, grades } = body;

    if (!studentId || !academicYear || !Array.isArray(grades)) {
      return NextResponse.json(
        { error: "Некорректные данные" },
        { status: 400 }
      );
    }

    // TODO: Создать таблицу final_grades и раскомментировать код
    /*
    for (const grade of grades) {
      await db
        .insert(finalGrades)
        .values({
          studentId,
          academicYear,
          ...grade,
        })
        .onConflictDoUpdate({
          target: [finalGrades.studentId, finalGrades.subjectId, finalGrades.academicYear],
          set: grade,
        });
    }
    */

    console.log("[API] PUT /api/final-grades", body);
    console.log("[DB] INSERT INTO final_grades ... ON CONFLICT DO UPDATE");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при обновлении итоговых оценок:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
