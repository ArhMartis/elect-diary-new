import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subjects } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Только админ может создавать предметы
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Нет прав" }, { status: 403 });
    }

    // Получаем данные из формы
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const type = (formData.get("type") as string) || "regular";

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Название предмета пустое" },
        { status: 400 }
      );
    }

    // Создаем предмет
    await db.insert(subjects).values({ 
      name: name.trim(),
      type: type,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json(
      { error: "Ошибка при создании предмета" },
      { status: 500 }
    );
  }
}
