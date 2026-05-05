import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { absences } from "@/db/schema/diary-extra";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${year + 1}`;
}

function getMonthName(date: Date): string {
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  return months[date.getMonth()];
}

/**
 * API: GET /api/absences
 * 
 * Получение данных о пропусках ученика
 * 
 * Query параметры:
 * - studentId: string - ID ученика
 * - date?: string - конкретная дата (YYYY-MM-DD)
 * - month?: string - месяц (напр. "Сентябрь")
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const date = searchParams.get("date");
    const month = searchParams.get("month");

    if (!studentId) {
      return NextResponse.json({ error: "Не указан studentId" }, { status: 400 });
    }

    // Если запрос за конкретной датой - это запрос посещаемости
    if (date) {
      // TODO: Реализовать таблицу для дневной посещаемости
      // Пока возвращаем заглушку
      return NextResponse.json([]);
    }

    // Получаем пропуски по месяцам
    const absencesList = await db
      .select()
      .from(absences)
      .where(eq(absences.studentId, studentId));

    return NextResponse.json(absencesList);
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
 * Сохранение данных о пропусках/посещаемости
 * 
 * Body (для дневной посещаемости):
 * - studentId: string
 * - date: string (YYYY-MM-DD)
 * - type: "present" | "absent" | "unexcused"
 * 
 * Body (для месячной статистики):
 * - studentId: string
 * - month: string
 * - total: number
 * - unexcused: number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, date, type, month, total, unexcused } = body;

    // Дневная посещаемость
    if (date && type) {
      // TODO: Создать отдельную таблицу для дневной посещаемости
      // Пока просто логируем
      return NextResponse.json({ success: true, message: "Посещаемость отмечена (заглушка)" });
    }

    // Месячная статистика пропусков
    if (!studentId || !month || total === undefined || unexcused === undefined) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    const academicYear = getCurrentAcademicYear();

    // Проверяем, есть ли уже запись за этот месяц
    const existing = await db.query.absences.findFirst({
      where: and(
        eq(absences.studentId, studentId),
        eq(absences.month, month),
        eq(absences.academicYear, academicYear)
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
        academicYear,
        total,
        unexcused,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении данных о пропусках:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
