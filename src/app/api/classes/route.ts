import { NextResponse } from "next/server";
import { db } from "@/db";
import { groups } from "@/db/schema/auth_schema";

/**
 * API: GET /api/classes
 * 
 * Возвращает список всех классов из БД
 * 
 * Таблица: groups
 * 
 * @returns Array<{ id: number, name: string, teacherId: string | null }>
 */
export async function GET() {
  try {
    const classes = await db.select().from(groups);
    return NextResponse.json(classes);
  } catch (error) {
    console.error("Ошибка при получении классов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
