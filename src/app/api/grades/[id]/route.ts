import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { grades } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const gradeId = parseInt(id);
    if (isNaN(gradeId)) {
      return NextResponse.json({ error: "Invalid grade ID" }, { status: 400 });
    }

    const grade = await db.query.grades.findFirst({ where: eq(grades.id, gradeId) });
    if (!grade) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }

    const role = session.user.role;
    if (role !== "admin" && role !== "principal") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await db.delete(grades).where(eq(grades.id, gradeId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
