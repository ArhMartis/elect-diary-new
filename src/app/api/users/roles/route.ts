import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json();
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({});
    }

    const users = await db
      .select({ email: user.email, role: user.role, fullName: user.fullName })
      .from(user)
      .where(inArray(user.email, emails));

    const infoMap: Record<string, { role: string; fullName: string }> = {};
    users.forEach((u) => {
      if (u.email) {
        infoMap[u.email] = {
          role: u.role || "",
          fullName: u.fullName || "",
        };
      }
    });

    return NextResponse.json(infoMap);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({}, { status: 500 });
  }
}
