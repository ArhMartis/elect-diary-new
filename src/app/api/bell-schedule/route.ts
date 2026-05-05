import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * API: GET /api/bell-schedule
 * 
 * Получение расписания звонков
 * 
 * Таблица: bell_schedule (создать отдельно!)
 * Структура таблицы:
 * CREATE TABLE bell_schedule (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   number TEXT NOT NULL,
 *   start TEXT NOT NULL,
 *   end TEXT NOT NULL,
 *   break TEXT,
 *   sortOrder INTEGER DEFAULT 0
 * )
 * 
 * @returns Array<{
 *   id: number,
 *   number: string,
 *   start: string,
 *   end: string,
 *   break: string
 * }>
 */
export async function GET() {
  try {
    // TODO: Создать таблицу bell_schedule и раскомментировать код
    /*
    const schedule = await db.query.bellSchedule.findMany({
      orderBy: (bellSchedule, { asc }) => [asc(bellSchedule.sortOrder)],
    });
    return NextResponse.json(schedule);
    */

    // Возвращаем заглушку
    return NextResponse.json([
      { number: "1", start: "8:00", end: "8:45", break: "15 мин" },
      { number: "2", start: "9:00", end: "9:45", break: "10 мин" },
      { number: "3", start: "10:00", end: "10:45", break: "20 мин" },
      { number: "4", start: "11:05", end: "11:50", break: "10 мин" },
      { number: "5", start: "12:00", end: "12:45", break: "10 мин" },
      { number: "6", start: "12:55", end: "13:40", break: "10 мин" },
      { number: "7", start: "13:50", end: "14:35", break: "10 мин" },
      { number: "8", start: "14:45", end: "15:30", break: "—" },
    ]);
  } catch (error) {
    console.error("Ошибка при получении расписания звонков:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/bell-schedule
 * 
 * Сохранение расписания звонков (массив)
 * 
 * Body:
 * - schedule: Array<{ number: string, start: string, end: string, break: string }>
 * 
 * Таблица: bell_schedule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedule } = body;

    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: "Ожидается массив расписаний" }, { status: 400 });
    }

    // TODO: Создать таблицу bell_schedule и раскомментировать код
    /*
    // Очищаем текущее расписание
    await db.delete(bellSchedule);

    // Вставляем новое расписание
    await db.insert(bellSchedule).values(
      schedule.map((item, index) => ({
        number: item.number,
        start: item.start,
        end: item.end,
        break: item.break,
        sortOrder: index,
      }))
    );
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении расписания звонков:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
