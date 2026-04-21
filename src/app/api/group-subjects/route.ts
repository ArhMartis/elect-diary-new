import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { groupSubjects } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const groupId = request.nextUrl.searchParams.get("groupId");
    if (!groupId) {
      return NextResponse.json({ error: "groupId required" }, { status: 400 });
    }
    const rows = await db.select().from(groupSubjects).where(eq(groupSubjects.groupId, Number(groupId)));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error getting group subjects:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { groupId, subjectIds } = await request.json();
    if (!groupId || !Array.isArray(subjectIds)) {
      return NextResponse.json({ error: "groupId and subjectIds required" }, { status: 400 });
    }
    await db.delete(groupSubjects).where(eq(groupSubjects.groupId, Number(groupId)));
    if (subjectIds.length > 0) {
      const values = subjectIds.map((subjectId: number) => ({
        groupId: Number(groupId),
        subjectId,
      }));
      await db.insert(groupSubjects).values(values);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving group subjects:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
