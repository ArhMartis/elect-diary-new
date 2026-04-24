import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * API: GET /api/holidays
 * 
 * Получение дат каникул
 * 
 * Query параметры:
 * - academicYear?: string - учебный год (напр. "2025/2026")
 * 
 * Таблица: holidays (создать отдельно!)
 * Структура таблицы:
 * CREATE TABLE holidays (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   academicYear TEXT NOT NULL,
 *   autumnStart TEXT,
 *   autumnEnd TEXT,
 *   winterStart TEXT,
 *   winterEnd TEXT,
 *   springStart TEXT,
 *   springEnd TEXT,
 *   summerStart TEXT,
 *   summerEnd TEXT
 * )
 * 
 * @returns {
 *   autumn: string,
 *   winter: string,
 *   spring: string,
 *   summer: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const academicYear = searchParams.get("academicYear");

    // TODO: Создать таблицу holidays и раскомментировать код
    /*
    const holidays = await db.query.holidays.findFirst({
      where: academicYear ? eq(holidays.academicYear, academicYear) : undefined,
    });

    if (!holidays) {
      return NextResponse.json({
        autumn: "",
        winter: "",
        spring: "",
        summer: "",
      });
    }

    return NextResponse.json({
      autumn: `${holidays.autumnStart} по ${holidays.autumnEnd}`,
      winter: `${holidays.winterStart} по ${holidays.winterEnd}`,
      spring: `${holidays.springStart} по ${holidays.springEnd}`,
      summer: `${holidays.summerStart} по ${holidays.summerEnd}`,
    });
    */

    console.log("[API] GET /api/holidays", { academicYear });
    console.log("[DB] SELECT * FROM holidays WHERE academicYear = ?", academicYear);

    // Возвращаем заглушку
    return NextResponse.json({
      autumn: "",
      winter: "",
      spring: "",
      summer: "",
    });
  } catch (error) {
    console.error("Ошибка при получении дат каникул:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/holidays
 * 
 * Сохранение дат каникул
 * 
 * Body:
 * - academicYear: string
 * - autumn: string (формат: "с __ по __" или "dd.mm.yyyy - dd.mm.yyyy")
 * - winter: string
 * - spring: string
 * - summer: string
 * 
 * Таблица: holidays
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { academicYear, autumn, winter, spring, summer } = body;

    if (!academicYear) {
      return NextResponse.json({ error: "Учебный год обязателен" }, { status: 400 });
    }

    // Парсим даты из формата "с __ по __"
    const parseDates = (dateString: string) => {
      const match = dateString.match(/с\s+(.+?)\s+по\s+(.+)/);
      if (match) {
        return { start: match[1].trim(), end: match[2].trim() };
      }
      return { start: "", end: "" };
    };

    const autumnDates = parseDates(autumn || "");
    const winterDates = parseDates(winter || "");
    const springDates = parseDates(spring || "");
    const summerDates = parseDates(summer || "");

    // TODO: Создать таблицу holidays и раскомментировать код
    /*
    const existing = await db.query.holidays.findFirst({
      where: eq(holidays.academicYear, academicYear),
    });

    if (existing) {
      await db
        .update(holidays)
        .set({
          autumnStart: autumnDates.start,
          autumnEnd: autumnDates.end,
          winterStart: winterDates.start,
          winterEnd: winterDates.end,
          springStart: springDates.start,
          springEnd: springDates.end,
          summerStart: summerDates.start,
          summerEnd: summerDates.end,
        })
        .where(eq(holidays.academicYear, academicYear));
    } else {
      await db.insert(holidays).values({
        academicYear,
        autumnStart: autumnDates.start,
        autumnEnd: autumnDates.end,
        winterStart: winterDates.start,
        winterEnd: winterDates.end,
        springStart: springDates.start,
        springEnd: springDates.end,
        summerStart: summerDates.start,
        summerEnd: summerDates.end,
      });
    }
    */

    console.log("[API] POST /api/holidays", body);
    console.log("[DB] INSERT INTO holidays (studentId, month, total, unexcused) VALUES (?, ?, ?, ?)",
      academicYear, autumn, winter, spring, summer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении дат каникул:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
