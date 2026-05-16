import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, account, resetTokens } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Token and password (min 6 chars) required" }, { status: 400 });
    }

    const stored = await db.query.resetTokens.findFirst({
      where: and(
        eq(resetTokens.token, token),
        eq(resetTokens.used, false)
      ),
    });

    if (!stored) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    const userRecord = await db.query.user.findFirst({
      where: eq(user.email, stored.email),
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.update(account)
      .set({ password: newPassword })
      .where(eq(account.userId, userRecord.id));

    await db.update(resetTokens)
      .set({ used: true })
      .where(eq(resetTokens.id, stored.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
