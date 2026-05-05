import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * API: GET /api/school-contacts
 * 
 * Получение контактной информации школы
 * 
 * Query параметры:
 * - schoolId?: number - ID школы (опционально, если несколько школ)
 * 
 * Таблица: school_contacts (создать отдельно!)
 * Структура таблицы:
 * CREATE TABLE school_contacts (
 *   id INTEGER PRIMARY KEY AUTOINCREMENT,
 *   schoolName TEXT NOT NULL,
 *   schoolAddress TEXT,
 *   schoolPhone TEXT,
 *   director TEXT,
 *   vicePrincipal TEXT,
 *   vicePrincipalEdu TEXT,
 *   homeroomTeacher TEXT,
 *   psychologist TEXT,
 *   socialPedagogue TEXT,
 *   updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
 * )
 * 
 * @returns {
 *   schoolName: string,
 *   schoolAddress: string,
 *   schoolPhone: string,
 *   director: string,
 *   vicePrincipal: string,
 *   vicePrincipalEdu: string,
 *   homeroomTeacher: string,
 *   psychologist: string,
 *   socialPedagogue: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Создать таблицу school_contacts и раскомментировать код
    /*
    const contacts = await db.query.schoolContacts.findFirst();
    return NextResponse.json(contacts || {});
    */

    // Возвращаем заглушку
    return NextResponse.json({
      schoolName: "ГУО \"Средняя школа № 1\"",
      schoolAddress: "220000, г. Минск, ул. Примерная, д. 1",
      schoolPhone: "+375 17 123-45-67",
      director: "",
      vicePrincipal: "",
      vicePrincipalEdu: "",
      homeroomTeacher: "",
      psychologist: "",
      socialPedagogue: "",
    });
  } catch (error) {
    console.error("Ошибка при получении контактов школы:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/school-contacts
 * 
 * Сохранение контактной информации школы
 * 
 * Body:
 * - schoolName: string
 * - schoolAddress?: string
 * - schoolPhone?: string
 * - director?: string
 * - vicePrincipal?: string
 * - vicePrincipalEdu?: string
 * - homeroomTeacher?: string
 * - psychologist?: string
 * - socialPedagogue?: string
 * 
 * Таблица: school_contacts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolName,
      schoolAddress,
      schoolPhone,
      director,
      vicePrincipal,
      vicePrincipalEdu,
      homeroomTeacher,
      psychologist,
      socialPedagogue,
    } = body;

    if (!schoolName) {
      return NextResponse.json({ error: "Название школы обязательно" }, { status: 400 });
    }

    // TODO: Создать таблицу school_contacts и раскомментировать код
    /*
    // Проверяем, есть ли уже запись
    const existing = await db.query.schoolContacts.findFirst();

    if (existing) {
      // Обновляем существующую запись
      await db
        .update(schoolContacts)
        .set({
          schoolName,
          schoolAddress,
          schoolPhone,
          director,
          vicePrincipal,
          vicePrincipalEdu,
          homeroomTeacher,
          psychologist,
          socialPedagogue,
        })
        .where(eq(schoolContacts.id, existing.id));
    } else {
      // Создаем новую запись
      await db.insert(schoolContacts).values({
        schoolName,
        schoolAddress,
        schoolPhone,
        director,
        vicePrincipal,
        vicePrincipalEdu,
        homeroomTeacher,
        psychologist,
        socialPedagogue,
      });
    }
    */

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении контактов школы:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
