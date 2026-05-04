import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { schedule, subjects, groups } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";

const DAYS_OF_WEEK: Record<string, number> = {
  "Понедельник": 1,
  "Вторник": 2,
  "Среда": 3,
  "Четверг": 4,
  "Пятница": 5,
  "Суббота": 6,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = body as Array<{
      groupId: number;
      scheduleData: Record<string, string>;
    }>;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Ожидается массив" }, { status: 400 });
    }

    const allSubjects = await db.select().from(subjects);
    const subjectMap = new Map(allSubjects.map(s => [s.name, s.id]));

    let totalImported = 0;
    let totalSkipped = 0;

    // Удаляем дубли: для регулярного расписания (без даты) ключ = groupId+dayOfWeek+lessonNumber+subjectId
    // Сначала получим существующие записи
    const allExisting = await db.select().from(schedule);
    const existingKeys = new Set(allExisting.map(e =>
      `${e.groupId}-${e.dayOfWeek ?? 'n'}-${e.lessonNumber}-${e.subjectId}-${e.lessonDate ?? 'n'}`
    ));

    for (const item of items) {
      const { groupId, scheduleData } = item;

      for (const [key, subjectName] of Object.entries(scheduleData)) {
        if (!subjectName || subjectName.trim() === "") continue;

        const subjectId = subjectMap.get(subjectName);
        if (!subjectId) {
          console.warn(`Предмет не найден: "${subjectName}"`);
          totalSkipped++;
          continue;
        }

        const parts = key.split("-");
        let dayOfWeek: number | null = null;
        let lessonDate: string | null = null;
        let lessonNumber: number;

        if (parts.length === 3) {
          // quarter-dayName-lessonIndex
          const dayName = parts[1];
          dayOfWeek = DAYS_OF_WEEK[dayName] || null;
          lessonNumber = parseInt(parts[2]) + 1;
        } else if (parts.length === 6) {
          // quarter-YYYY-MM-DD-dayName-lessonIndex
          lessonDate = `${parts[1]}-${parts[2]}-${parts[3]}`;
          const dayName = parts[4];
          dayOfWeek = DAYS_OF_WEEK[dayName] || null;
          lessonNumber = parseInt(parts[5]) + 1;
        } else {
          totalSkipped++;
          continue;
        }

        if (!dayOfWeek && !lessonDate) {
          totalSkipped++;
          continue;
        }

        const dedupeKey = `${groupId}-${dayOfWeek ?? 'n'}-${lessonNumber}-${subjectId}-${lessonDate ?? 'n'}`;
        if (existingKeys.has(dedupeKey)) {
          totalSkipped++;
          continue;
        }

        await db.insert(schedule).values({
          groupId,
          subjectId,
          teacherId: null,
          lessonDate,
          dayOfWeek,
          lessonNumber,
        });

        existingKeys.add(dedupeKey);
        totalImported++;
      }
    }

    return NextResponse.json({ imported: totalImported, skipped: totalSkipped });
  } catch (error) {
    console.error("Ошибка импорта расписания:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}