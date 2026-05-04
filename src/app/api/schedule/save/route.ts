import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { schedule, subjects } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";

const DAYS_OF_WEEK: Record<string, number> = {
  "Понедельник": 1,
  "Вторник": 2,
  "Среда": 3,
  "Четверг": 4,
  "Пятница": 5,
  "Суббота": 6,
  "Пн": 1,
  "Вт": 2,
  "Ср": 3,
  "Чт": 4,
  "Пт": 5,
  "Сб": 6,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, scheduleData } = body as {
      groupId: number;
      scheduleData: Record<string, string>;
    };

    if (!groupId || !scheduleData) {
      return NextResponse.json({ error: "groupId и scheduleData обязательны" }, { status: 400 });
    }

    const allSubjects = await db.select().from(subjects);
    const subjectMap = new Map(allSubjects.map(s => [s.name, s.id]));

    let created = 0;
    let deleted = 0;

    // Удаляем существующие записи для этой группы
    const existing = await db
      .select()
      .from(schedule)
      .where(eq(schedule.groupId, groupId));

    for (const row of existing) {
      if (!row.lessonDate) {
        await db.delete(schedule).where(eq(schedule.id, row.id));
        deleted++;
      }
    }

    // Вставляем новое расписание
    for (const [key, subjectName] of Object.entries(scheduleData)) {
      if (!subjectName || subjectName.trim() === "") continue;

      const subjectId = subjectMap.get(subjectName);
      if (!subjectId) continue;

      const parts = key.split("-");
      let dayOfWeek: number | null = null;
      let lessonDate: string | null = null;
      let lessonNumber: number;
      let quarter: number | null = null;

      if (parts.length === 3) {
        // quarter-dayName-lessonNum
        quarter = parseInt(parts[0]);
        const dayName = parts[1];
        dayOfWeek = DAYS_OF_WEEK[dayName] || null;
        lessonNumber = parseInt(parts[2]) + 1;
      } else if (parts.length === 6) {
        // quarter-YYYY-MM-DD-dayName-lessonNum
        quarter = parseInt(parts[0]);
        lessonDate = `${parts[1]}-${parts[2]}-${parts[3]}`;
        const dayName = parts[4];
        dayOfWeek = DAYS_OF_WEEK[dayName] || null;
        lessonNumber = parseInt(parts[5]) + 1;
      } else {
        continue;
      }

      if (!dayOfWeek && !lessonDate) continue;

      await db.insert(schedule).values({
        groupId,
        subjectId,
        teacherId: null,
        lessonDate,
        dayOfWeek,
        lessonNumber,
        quarter,
      });

      created++;
    }

    return NextResponse.json({ created, deleted });
  } catch (error) {
    console.error("Ошибка сохранения расписания:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}