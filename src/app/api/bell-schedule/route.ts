import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bellSchedule } from "@/db/schema/diary-extra";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const schedule = await db.query.bellSchedule.findMany({
      orderBy: [asc(bellSchedule.sortOrder)],
    });
    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Ошибка при получении расписания звонков:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedule } = body;

    if (!Array.isArray(schedule)) {
      return NextResponse.json({ error: "Ожидается массив расписаний" }, { status: 400 });
    }

    await db.delete(bellSchedule);
    await db.insert(bellSchedule).values(
      schedule.map((item: any, index: number) => ({
        number: item.number,
        start: item.start,
        end: item.end,
        break: item.break,
        sortOrder: index,
      }))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении расписания звонков:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
