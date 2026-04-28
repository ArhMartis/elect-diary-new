import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, groupSubjects, schedule } from "@/db/schema/auth_schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const groupId = request.nextUrl.searchParams.get("groupId");
    const teacherId = request.nextUrl.searchParams.get("teacherId");
    
    if (!groupId) {
      return NextResponse.json({ error: "groupId required" }, { status: 400 });
    }

    // Если передан teacherId, вернем предметы, которые этот учитель ведет для этой группы
    if (teacherId) {
      // Получаем уникальные subjectId из расписания для этого учителя и группы
      const teacherScheduleRows = await db
        .select({ subjectId: schedule.subjectId })
        .from(schedule)
        .where(
          eq(schedule.teacherId, teacherId)
          // Не фильтруем по groupId - учитель может преподавать в разных группах
        );

      const uniqueSubjectIds = [...new Set(teacherScheduleRows.map(r => r.subjectId))];
      
      if (uniqueSubjectIds.length > 0) {
        const subjectList = await db
          .select({ id: subjects.id, name: subjects.name })
          .from(subjects)
          .where(inArray(subjects.id, uniqueSubjectIds));

        return NextResponse.json(subjectList);
      }
      return NextResponse.json([]);
    }
    
    // Без teacherId - возвращаем предметы группы
    const groupSubjectRows = await db
      .select({ subjectId: groupSubjects.subjectId })
      .from(groupSubjects)
      .where(eq(groupSubjects.groupId, Number(groupId)));
    
    if (groupSubjectRows.length === 0) {
      return NextResponse.json([]);
    }
    
    const subjectIds = groupSubjectRows.map(row => row.subjectId);
    
    // Получаем сами предметы (только обычные, без мероприятий и классного часа)
    const subjectList = await db
      .select({
        id: subjects.id,
        name: subjects.name,
      })
      .from(subjects)
      .where(inArray(subjects.id, subjectIds));
    
    return NextResponse.json(subjectList);
  } catch (error) {
    console.error("Error getting subjects for group:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
