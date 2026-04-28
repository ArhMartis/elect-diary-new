import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, groupSubjects } from "@/db/schema/auth_schema";
import { eq, inArray, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const groupId = request.nextUrl.searchParams.get("groupId");
    if (!groupId) {
      return NextResponse.json({ error: "groupId required" }, { status: 400 });
    }

    // Получаем ID предметов для группы
    const groupSubjectRows = await db
      .select({ subjectId: groupSubjects.subjectId })
      .from(groupSubjects)
      .where(eq(groupSubjects.groupId, Number(groupId)));

    const subjectIds = groupSubjectRows.map(row => row.subjectId);

    // Если есть предметы в groupSubjects, получаем их
    let subjectList: { id: number; name: string; type?: string | null }[] = [];

    if (subjectIds.length > 0) {
      subjectList = await db
        .select({
          id: subjects.id,
          name: subjects.name,
          type: subjects.type,
        })
        .from(subjects)
        .where(inArray(subjects.id, subjectIds));
    }

    // Добавляем классные часы и мероприятия (всегда доступны)
    const eventSubjects = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        type: subjects.type,
      })
      .from(subjects)
      .where(
        or(
          eq(subjects.type, "class_hour"),
          eq(subjects.type, "event")
        )
      );

    // Объединяем и убираем дубликаты
    const allSubjects = [...subjectList];
    for (const eventSub of eventSubjects) {
      if (!allSubjects.find(s => s.id === eventSub.id)) {
        allSubjects.push(eventSub);
      }
    }

    return NextResponse.json(allSubjects);
  } catch (error) {
    console.error("Error getting subjects for group:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
