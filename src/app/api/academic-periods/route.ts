import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { academicPeriods } from "@/db/schema/auth_schema";
import { asc, or, eq, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const groupId = request.nextUrl.searchParams.get("groupId");

    let periods;
    if (groupId) {
      periods = await db
        .select()
        .from(academicPeriods)
        .where(
          or(
            eq(academicPeriods.groupId, parseInt(groupId)),
            isNull(academicPeriods.groupId)
          )
        )
        .orderBy(asc(academicPeriods.startDate));
    } else {
      periods = await db
        .select()
        .from(academicPeriods)
        .where(isNull(academicPeriods.groupId))
        .orderBy(asc(academicPeriods.startDate));
    }

    return NextResponse.json(periods);
  } catch (error) {
    console.error("Error fetching academic periods:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}