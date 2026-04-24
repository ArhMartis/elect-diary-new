import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects, groupSubjects } from "@/db/schema/auth_schema";
import { eq, inArray } from "drizzle-orm";

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
    
    if (groupSubjectRows.length === 0) {
      return NextResponse.json([]);
    }
    
    const subjectIds = groupSubjectRows.map(row => row.subjectId);
    
    // Получаем сами предметы
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
