import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { schedule, subjects, user } from "@/db/schema/auth_schema";
import { eq, and, asc, gte, lte, or, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const subjectId = searchParams.get("subjectId");
    const teacherId = searchParams.get("teacherId");
    const quarter = searchParams.get("quarter");

    if (!groupId) {
      return NextResponse.json(
        { error: "Не указан groupId" },
        { status: 400 }
      );
    }

    const conditions: any[] = [
      eq(schedule.groupId, parseInt(groupId)),
    ];

    if (teacherId) {
      conditions.push(eq(schedule.teacherId, teacherId));
    }

    if (subjectId) {
      conditions.push(eq(schedule.subjectId, parseInt(subjectId)));
    }

    if (quarter) {
      // Фильтр по четверти: записи для этой четверти ИЛИ общие записи без четверти (null)
      conditions.push(
        or(
          eq(schedule.quarter, parseInt(quarter)),
          isNull(schedule.quarter)
        )
      );
    }

    if (startDate && endDate) {
      conditions.push(
        or(
          and(
            gte(schedule.lessonDate, startDate),
            lte(schedule.lessonDate, endDate)
          ),
          isNull(schedule.lessonDate)
        )
      );
    }

    const whereCondition = and(...conditions);

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
        quarter: schedule.quarter,
      })
      .from(schedule)
      .leftJoin(subjects, eq(schedule.subjectId, subjects.id))
      .leftJoin(user, eq(schedule.teacherId, user.id))
      .where(whereCondition)
      .orderBy(asc(schedule.quarter), asc(schedule.dayOfWeek), asc(schedule.lessonNumber));

    return NextResponse.json(scheduleList);
  } catch (error) {
    console.error("Ошибка при получении расписания:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}