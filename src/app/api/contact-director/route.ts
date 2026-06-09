import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { messages } from "@/db/schema/messages";
import { user } from "@/db/schema/auth_schema";
import { eq, and, inArray } from "drizzle-orm";
import { headers } from "next/headers";

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

    if (session.user.role === "admin" || session.user.role === "principal") {
      return NextResponse.json({ error: "Администратор и директор не могут отправлять обращения директору" }, { status: 403 });
    }

    const principals = await db.select({ id: user.id }).from(user).where(eq(user.role, "principal"));
    if (principals.length === 0) {
      return NextResponse.json({ error: "Директор не найден в системе" }, { status: 404 });
    }

    await db.insert(messages).values({
      content: content.trim(),
      senderId: session.user.id,
      receiverId: principals[0].id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending contact-director message:", error);
    return NextResponse.json({ error: "Ошибка отправки" }, { status: 500 });
  }
}
