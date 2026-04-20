import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { homework, subjects, user, groups } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";

/**
 * API: GET /api/homework
 * 
 * Получение домашних заданий
 * 
 * Query параметры:
 * - groupId?: number - ID класса
 * - lessonDate?: string - дата урока (YYYY-MM-DD)
 * - studentId?: string - ID ученика (для получения заданий по его классу)
 * 
 * Таблицы:
 * - homework (id, teacherId, groupId, subjectId, lessonDate, description, dueDate, createdAt)
 * - subjects (id, name)
 * - user (id, full_name)
 * - groups (id, name)
 * 
 * @returns Array<{
 *   id: number,
 *   teacherId: string,
 *   teacherName: string,
 *   groupId: number,
 *   groupName: string,
 *   subjectId: number,
 *   subjectName: string,
 *   lessonDate: string,
 *   description: string,
 *   dueDate: string | null,
 *   createdAt: number
 * }>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const lessonDate = searchParams.get("lessonDate");
    const studentId = searchParams.get("studentId");

    let targetGroupId = groupId;

    // Если передан studentId, получаем его класс
    if (studentId && !groupId) {
      const student = await db.query.user.findFirst({
        where: eq(user.id, studentId),
        columns: { groupId: true },
      });
      targetGroupId = student?.groupId?.toString() || null;
    }

    // Формируем условие WHERE
    let whereCondition = undefined;
    
    if (targetGroupId && lessonDate) {
      whereCondition = and(
        eq(homework.groupId, parseInt(targetGroupId)),
        eq(homework.lessonDate, lessonDate)
      );
    } else if (targetGroupId) {
      whereCondition = eq(homework.groupId, parseInt(targetGroupId));
    } else if (lessonDate) {
      whereCondition = eq(homework.lessonDate, lessonDate);
    }

    // Получаем домашние задания с связанными данными
    const homeworkList = await db
      .select({
        id: homework.id,
        teacherId: homework.teacherId,
        teacherName: user.fullName,
        groupId: homework.groupId,
        groupName: groups.name,
        subjectId: homework.subjectId,
        subjectName: subjects.name,
        lessonDate: homework.lessonDate,
        description: homework.description,
        dueDate: homework.dueDate,
        createdAt: homework.createdAt,
      })
      .from(homework)
      .leftJoin(user, eq(homework.teacherId, user.id))
      .leftJoin(groups, eq(homework.groupId, groups.id))
      .leftJoin(subjects, eq(homework.subjectId, subjects.id))
      .where(whereCondition)
      .orderBy(homework.lessonDate);

    return NextResponse.json(homeworkList);
  } catch (error) {
    console.error("Ошибка при получении домашних заданий:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: POST /api/homework
 * 
 * Добавление домашнего задания
 * 
 * Body:
 * - teacherId: string
 * - groupId: number
 * - subjectId: number
 * - lessonDate: string (YYYY-MM-DD)
 * - description: string
 * - dueDate?: string (YYYY-MM-DD)
 * 
 * Таблица: homework
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherId, groupId, subjectId, lessonDate, description, dueDate } = body;

    // Валидация обязательных полей
    if (!teacherId || !groupId || !subjectId || !lessonDate || !description) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    // Вставляем новое домашнее задание
    const [newHomework] = await db
      .insert(homework)
      .values({
        teacherId,
        groupId,
        subjectId,
        lessonDate,
        description,
        dueDate: dueDate || null,
      })
      .returning();

    return NextResponse.json(newHomework, { status: 201 });
  } catch (error) {
    console.error("Ошибка при добавлении домашнего задания:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: PUT /api/homework
 * 
 * Обновление домашнего задания
 * 
 * Body:
 * - id: number
 * - description?: string
 * - dueDate?: string
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, description, dueDate } = body;

    if (!id) {
      return NextResponse.json({ error: "Не указан ID домашнего задания" }, { status: 400 });
    }

    // Обновляем домашнее задание
    const [updatedHomework] = await db
      .update(homework)
      .set({
        description: description,
        dueDate: dueDate,
      })
      .where(eq(homework.id, id))
      .returning();

    return NextResponse.json(updatedHomework);
  } catch (error) {
    console.error("Ошибка при обновлении домашнего задания:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * API: DELETE /api/homework
 * 
 * Удаление домашнего задания
 * 
 * Body:
 * - id: number
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Не указан ID домашнего задания" }, { status: 400 });
    }

    await db.delete(homework).where(eq(homework.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении домашнего задания:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
