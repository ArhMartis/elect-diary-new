import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existing = await db.query.user.findFirst({
      where: eq(user.email, email),
      columns: { id: true },
    });

    return NextResponse.json({ exists: !!existing });
  } catch {
    return NextResponse.json({ exists: false, error: "Server error" }, { status: 500 });
  }
}
