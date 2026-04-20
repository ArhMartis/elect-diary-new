import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, groups } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";

/**
 * API: GET /api/student/{id}
 * 
 * Возвращает данные ученика по ID
 * 
 * Таблицы:
 * - users (id, full_name, groupId)
 * - groups (id, name)
 * 
 * @returns {
 *   id: string,
 *   fullName: string,
 *   surname: string,
 *   name: string,
 *   classId: number,
 *   className: string,
 *   schoolName: string,
 *   schoolAddress: string,
 *   schoolPhone: string,
 *   academicYear: string
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Получаем данные ученика
    const student = await db.query.user.findFirst({
      where: eq(user.id, id),
      with: {
        group: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Ученик не найден" }, { status: 404 });
    }

    // Формируем ответ
    // TODO: Добавить поля schoolName, schoolAddress, schoolPhone из отдельной таблицы school_info
    const response = {
      id: student.id,
      fullName: student.fullName,
      surname: student.fullName.split(" ")[0] || "",
      name: student.fullName.split(" ")[1] || "",
      classId: student.groupId || 0,
      className: student.group?.name || "",
      schoolName: "ГУО \"Средняя школа № 1\"", // TODO: из таблицы school_info
      schoolAddress: "220000, г. Минск, ул. Примерная, д. 1", // TODO: из таблицы school_info
      schoolPhone: "+375 17 123-45-67", // TODO: из таблицы school_info
      academicYear: "2025/2026", // TODO: из таблицы academic_years
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Ошибка при получении данных ученика:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
