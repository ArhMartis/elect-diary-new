import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { schedule, subjects, user } from "@/db/schema/auth_schema";
import { eq, and, gte, lte, asc } from "drizzle-orm";

/**
 * API: GET /api/schedule
 * 
 * Получение расписания класса
 * 
 * Query параметры:
 * - groupId: number - ID класса (обязательно)
 * - startDate?: string - начало периода (YYYY-MM-DD)
 * - endDate?: string - конец периода (YYYY-MM-DD)
 * - subjectId?: number - фильтр по предмету
 * 
 * @returns Array<{
 *   id: number,
 *   groupId: number,
 *   subjectId: number,
 *   subjectName: string,
 *   teacherId: string,
 *   teacherName: string,
 *   lessonDate: string | null,
 *   dayOfWeek: number | null,
 *   lessonNumber: number,
 * }>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const subjectId = searchParams.get("subjectId");

    if (!groupId) {
      return NextResponse.json(
        { error: "Не указан groupId" },
        { status: 400 }
      );
    }

    // Формируем условия WHERE
    const conditions: (ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lte>)[] = [
      eq(schedule.groupId, parseInt(groupId)),
    ];

    if (subjectId) {
      conditions.push(eq(schedule.subjectId, parseInt(subjectId)));
    }

    if (startDate && endDate) {
      conditions.push(gte(schedule.lessonDate, startDate));
      conditions.push(lte(schedule.lessonDate, endDate));
    }

    const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];

    // Получаем расписание с связанными данными
    const scheduleList = await db
      .select({
        id: schedule.id,
        groupId: schedule.groupId,
        subjectId: schedule.subjectId,
        subjectName: subjects.name,
        teacherId: schedule.teacherId,
        teacherName: user.fullName,
        lessonDate: schedule.lessonDate,
        dayOfWeek: schedule.dayOfWeek,
        lessonNumber: schedule.lessonNumber,
      })
      .from(schedule)
      .leftJoin(subjects, eq(schedule.subjectId, subjects.id))
      .leftJoin(user, eq(schedule.teacherId, user.id))
      .where(whereCondition)
      .orderBy(asc(schedule.lessonDate), asc(schedule.dayOfWeek), asc(schedule.lessonNumber));

    return NextResponse.json(scheduleList);
  } catch (error) {
    console.error("Ошибка при получении расписания:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
