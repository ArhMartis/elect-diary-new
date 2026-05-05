import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * API: GET /api/electives
 * 
 * Получение списка факультативов
 * 
 * Query параметры:
 * - groupId?: number - ID класса (для получения факультативов конкретного класса)
 * 
 * Таблица: electives (создать отдельно!)
 * Структура таблицы:
 * CREATE TABLE electives (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   name TEXT NOT NULL,
 *   teacherId TEXT,
 *   teacherName TEXT,
 *   schedule TEXT,
 *   groupId INTEGER,
 *   FOREIGN KEY (teacherId) REFERENCES user(id) ON DELETE SET NULL,
 *   FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE SET NULL
 * )
 * 
 * @returns Array<{
 *   id: number,
 *   name: string,
 *   teacherId: string,
 *   teacherName: string,
 *   schedule: string
 * }>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");

    // TODO: Создать таблицу electives и раскомментировать код
    /*
    let whereCondition = undefined;
    if (groupId) {
      whereCondition = eq(electives.groupId, parseInt(groupId));
    }

    const electives = await db
      .select({
        id: electives.id,
        name: electives.name,
        teacherId: electives.teacherId,
        teacherName: user.fullName,
        schedule: electives.schedule,
      })
      .from(electives)
      .leftJoin(user, eq(electives.teacherId, user.id))
      .where(whereCondition);

    return NextResponse.json(electives);
    */

    // Возвращаем заглушку
    return NextResponse.json([]);
  } catch (error) {
    console.error("Ошибка при получении факультативов:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/electives
 * 
 * Добавление/обновление факультатива
 * 
 * Body:
 * - id?: number - ID для обновления
 * - name: string
 * - teacherId?: string
 * - teacherName?: string
 * - schedule?: string
 * - groupId?: number
 * 
 * Таблица: electives
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, teacherId, teacherName, schedule, groupId } = body;

    if (!name) {
      return NextResponse.json({ error: "Название факультатива обязательно" }, { status: 400 });
    }

    // TODO: Создать таблицу electives и раскомментировать код
    /*
    if (id) {
      // Обновление существующего факультатива
      await db
        .update(electives)
        .set({ name, teacherId, teacherName, schedule, groupId })
        .where(eq(electives.id, id));
    } else {
      // Добавление нового факультатива
      await db.insert(electives).values({
        name,
        teacherId,
        teacherName,
        schedule,
        groupId,
      });
    }
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении факультатива:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: DELETE /api/electives
 * 
 * Удаление факультатива
 * 
 * Body:
 * - id: number
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Не указан ID факультатива" }, { status: 400 });
    }

    // TODO: Создать таблицу electives и раскомментировать код
    /*
    await db.delete(electives).where(eq(electives.id, id));
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении факультатива:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
