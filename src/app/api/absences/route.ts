import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * API: GET /api/absences
 * 
 * Получение данных о пропусках ученика
 * 
 * Query параметры:
 * - studentId: string - ID ученика
 * - month?: string - месяц (напр. "Сентябрь")
 * 
 * Таблица: absences (создать отдельно!)
 * Структура таблицы:
 * CREATE TABLE absences (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   studentId TEXT NOT NULL,
 *   month TEXT NOT NULL,
 *   total INTEGER DEFAULT 0,
 *   unexcused INTEGER DEFAULT 0,
 *   date TEXT DEFAULT CURRENT_DATE,
 *   FOREIGN KEY (studentId) REFERENCES user(id) ON DELETE CASCADE
 * )
 * 
 * @returns Array<{
 *   id: number,
 *   studentId: string,
 *   month: string,
 *   total: number,
 *   unexcused: number,
 *   date: string
 * }>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const month = searchParams.get("month");

    if (!studentId) {
      return NextResponse.json({ error: "Не указан studentId" }, { status: 400 });
    }

    // TODO: Создать таблицу absences в БД
    // Пока возвращаем заглушку
    console.log("[API] GET /api/absences", { studentId, month });
    console.log("[DB] SELECT * FROM absences WHERE studentId = ? AND month = ?", studentId, month);

    return NextResponse.json([]);
  } catch (error) {
    console.error("Ошибка при получении данных о пропусках:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/absences
 * 
 * Сохранение данных о пропусках
 * 
 * Body:
 * - studentId: string
 * - month: string
 * - total: number
 * - unexcused: number
 * 
 * Таблица: absences
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, month, total, unexcused } = body;

    // Валидация обязательных полей
    if (!studentId || !month || total === undefined || unexcused === undefined) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // TODO: Создать таблицу absences и раскомментировать код
    /*
    // Проверяем, есть ли уже запись за этот месяц
    const existing = await db.query.absences.findFirst({
      where: and(
        eq(absences.studentId, studentId),
        eq(absences.month, month)
      ),
    });

    if (existing) {
      // Обновляем существующую запись
      await db
        .update(absences)
        .set({ total, unexcused })
        .where(eq(absences.id, existing.id));
    } else {
      // Создаем новую запись
      await db.insert(absences).values({
        studentId,
        month,
        total,
        unexcused,
      });
    }
    */

    console.log("[API] POST /api/absences", body);
    console.log("[DB] INSERT INTO absences (studentId, month, total, unexcused) VALUES (?, ?, ?, ?)",
      studentId, month, total, unexcused);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении данных о пропусках:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
