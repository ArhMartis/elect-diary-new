import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { messages } from "@/db/schema/messages";
import { user } from "@/db/schema/auth_schema";
import { eq, and, inArray } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ sent: false });
    }

    const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin"));
    const adminIds = admins.map(a => a.id);
    if (adminIds.length === 0) {
      return NextResponse.json({ sent: false });
    }

    const existing = await db.query.messages.findFirst({
      where: and(
        eq(messages.senderId, session.user.id),
        inArray(messages.receiverId, adminIds),
      ),
    });

    return NextResponse.json({ sent: !!existing });
  } catch (error) {
    console.error("Error checking contact-admin status:", error);
    return NextResponse.json({ sent: false });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Сообщение не может быть пустым" }, { status: 400 });
    }

    if (session.user.role !== "student") {
      return NextResponse.json({ error: "Только ученики могут отправлять сообщения администратору" }, { status: 403 });
    }

    const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin"));
    const adminIds = admins.map(a => a.id);
    if (adminIds.length === 0) {
      return NextResponse.json({ error: "Администратор не найден" }, { status: 404 });
    }

    // Проверяем, не отправлял ли уже ученик сообщение админу
    const existing = await db.query.messages.findFirst({
      where: and(
        eq(messages.senderId, session.user.id),
        inArray(messages.receiverId, adminIds),
      ),
    });
    if (existing) {
      return NextResponse.json({ error: "Вы уже отправили сообщение администратору" }, { status: 409 });
    }

    await db.insert(messages).values({
      content: content.trim(),
      senderId: session.user.id,
      receiverId: admins[0].id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending contact-admin message:", error);
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 });
  }
}
