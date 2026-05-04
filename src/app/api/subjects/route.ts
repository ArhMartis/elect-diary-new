import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, groupSubjects, schedule, teacherSubjects } from "@/db/schema/auth_schema";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const groupId = request.nextUrl.searchParams.get("groupId");
    const teacherId = request.nextUrl.searchParams.get("teacherId");

    if (!groupId) {
      return NextResponse.json({ error: "groupId required" }, { status: 400 });
    }

    if (teacherId) {
      const teacherSubjectRows = await db
        .select({ subjectId: teacherSubjects.subjectId })
        .from(teacherSubjects)
        .where(eq(teacherSubjects.teacherId, teacherId));

      let subjectIds = [...new Set(teacherSubjectRows.map((r) => r.subjectId))];

      if (subjectIds.length === 0) {
        const conditions = [eq(schedule.teacherId, teacherId)];
        conditions.push(eq(schedule.groupId, parseInt(groupId)));

        const scheduleRows = await db
          .select({ subjectId: schedule.subjectId })
          .from(schedule)
          .where(and(...conditions));

        subjectIds = [...new Set(scheduleRows.map((r) => r.subjectId))];
      }

      if (subjectIds.length === 0) {
        return NextResponse.json([]);
      }

      const subjectList = await db
        .select({ id: subjects.id, name: subjects.name })
        .from(subjects)
        .where(inArray(subjects.id, subjectIds));

      return NextResponse.json(subjectList);
    }

    const groupSubjectRows = await db
      .select({ subjectId: groupSubjects.subjectId })
      .from(groupSubjects)
      .where(eq(groupSubjects.groupId, Number(groupId)));

    if (groupSubjectRows.length > 0) {
      const subjectIds = groupSubjectRows.map((row) => row.subjectId);
      const subjectList = await db
        .select({
          id: subjects.id,
          name: subjects.name,
        })
        .from(subjects)
        .where(inArray(subjects.id, subjectIds));
      return NextResponse.json(subjectList);
    }

    const scheduleRows = await db
      .select({ subjectId: schedule.subjectId })
      .from(schedule)
      .where(eq(schedule.groupId, parseInt(groupId)));

    const uniqueSubjectIds = [...new Set(scheduleRows.map((r) => r.subjectId).filter(Boolean))] as number[];

    if (uniqueSubjectIds.length === 0) {
      return NextResponse.json([]);
    }

    const subjectList = await db
      .select({
        id: subjects.id,
        name: subjects.name,
      })
      .from(subjects)
      .where(inArray(subjects.id, uniqueSubjectIds));

    return NextResponse.json(subjectList);
  } catch (error) {
    console.error("Error getting subjects for group:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}