import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema/auth_schema";
import { electives } from "@/db/schema/diary-extra";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const type = (formData.get("type") as string) || "regular";

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Название предмета пустое" },
        { status: 400 }
      );
    }

    const [newSubject] = await db.insert(subjects).values({
      name: name.trim(),
      type: type,
    }).returning();

    // Для спецпредметов создаём запись в electives
    if ((type === "elective" || type === "olympiad") && newSubject) {
      await db.insert(electives).values({
        name: name.trim(),
        subjectId: newSubject.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Ошибка при создании предмета" },
      { status: 500 }
    );
  }
}
