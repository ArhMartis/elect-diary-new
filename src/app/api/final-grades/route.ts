import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { finalGrades as finalGradesTable } from "@/db/schema/diary-extra";
import { subjects } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";

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

    const rows = await db
      .select({
        subjectId: finalGradesTable.subjectId,
        subjectName: subjects.name,
        q1: finalGradesTable.q1,
        q2: finalGradesTable.q2,
        q3: finalGradesTable.q3,
        q4: finalGradesTable.q4,
        year: finalGradesTable.year,
        exam: finalGradesTable.exam,
        final: finalGradesTable.final,
        gradeType: finalGradesTable.gradeType,
      })
      .from(finalGradesTable)
      .leftJoin(subjects, eq(finalGradesTable.subjectId, subjects.id))
      .where(
        and(
          eq(finalGradesTable.studentId, studentId),
          academicYear ? eq(finalGradesTable.academicYear, academicYear) : undefined
        )
      );

    return NextResponse.json(rows);
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
    let { studentId, subjectId, academicYear, q1, q2, q3, q4, year, exam, final, subjectName } = body;

    if (!studentId || !academicYear) {
      return NextResponse.json(
        { error: "studentId и academicYear обязательны" },
        { status: 400 }
      );
    }

    if (!subjectId && subjectName) {
      const found = await db.query.subjects.findFirst({ where: eq(subjects.name, subjectName) });
      if (found) subjectId = found.id;
    }

    if (!subjectId) {
      return NextResponse.json({ error: "subjectId или subjectName обязательны" }, { status: 400 });
    }

    const existing = await db.query.finalGrades.findFirst({
      where: and(
        eq(finalGradesTable.studentId, studentId),
        eq(finalGradesTable.subjectId, subjectId),
        eq(finalGradesTable.academicYear, academicYear)
      ),
    });

    if (existing) {
      await db
        .update(finalGradesTable)
        .set({ q1, q2, q3, q4, year, exam, final, gradeType: body.gradeType })
        .where(eq(finalGradesTable.id, existing.id));
    } else {
      await db.insert(finalGradesTable).values({
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
        gradeType: body.gradeType || 'numeric',
      });
    }

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

    for (const grade of grades) {
      await db
        .insert(finalGradesTable)
        .values({
          studentId,
          academicYear,
          ...grade,
        })
        .onConflictDoUpdate({
          target: [finalGradesTable.studentId, finalGradesTable.subjectId, finalGradesTable.academicYear],
          set: grade,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при обновлении итоговых оценок:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
