import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { electives, electiveStudents } from "@/db/schema/diary-extra";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const studentId = searchParams.get("studentId");

    let whereCondition: any = undefined;
    if (groupId) {
      whereCondition = eq(electives.groupId, parseInt(groupId));
    }

    const list = await db.query.electives.findMany({
      where: whereCondition,
      with: {
        students: true,
      },
    });

    if (studentId) {
      const studentElectiveIds = await db
        .select({ electiveId: electiveStudents.electiveId })
        .from(electiveStudents)
        .where(eq(electiveStudents.studentId, studentId));
      const ids = new Set(studentElectiveIds.map(r => r.electiveId));
      return NextResponse.json(list.map(e => ({ ...e, assigned: ids.has(e.id) })));
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("Ошибка при получении факультативов:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, teacherId, teacherName, schedule, groupId } = body;

    if (!name || !groupId) {
      return NextResponse.json({ error: "Название и класс обязательны" }, { status: 400 });
    }

    const [newItem] = await db.insert(electives).values({
      name,
      teacherId: teacherId || null,
      teacherName: teacherName || null,
      schedule: schedule || null,
      groupId: parseInt(groupId),
    }).returning();

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Ошибка при создании факультатива:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, teacherId, teacherName, schedule, groupId } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID и название обязательны" }, { status: 400 });
    }

    const [updated] = await db.update(electives).set({
      name,
      teacherId: teacherId || null,
      teacherName: teacherName || null,
      schedule: schedule || null,
      groupId: groupId ? parseInt(groupId) : null,
    }).where(eq(electives.id, id)).returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ошибка при обновлении факультатива:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, studentId, electiveId } = body;

    if (studentId && electiveId) {
      await db.delete(electiveStudents).where(and(
        eq(electiveStudents.studentId, studentId),
        eq(electiveStudents.electiveId, electiveId)
      ));
      return NextResponse.json({ success: true, type: "student-removed" });
    }

    if (studentId && !electiveId) {
      const ids = Array.isArray(studentId) ? studentId : [studentId];
      await db.delete(electiveStudents).where(
        and(
          inArray(electiveStudents.studentId, ids),
          eq(electiveStudents.electiveId, body.electiveId)
        )
      );
      return NextResponse.json({ success: true, type: "students-synced" });
    }

    if (id) {
      await db.delete(electiveStudents).where(eq(electiveStudents.electiveId, id));
      await db.delete(electives).where(eq(electives.id, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Укажите id" }, { status: 400 });
  } catch (error) {
    console.error("Ошибка при удалении:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { electiveId, studentIds } = body;

    if (!electiveId || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: "electiveId и studentIds обязательны" }, { status: 400 });
    }

    await db.delete(electiveStudents).where(eq(electiveStudents.electiveId, electiveId));
    if (studentIds.length > 0) {
      await db.insert(electiveStudents).values(
        studentIds.map((sid: string) => ({ electiveId, studentId: sid }))
      );
    }

    return NextResponse.json({ success: true, assigned: studentIds.length });
  } catch (error) {
    console.error("Ошибка при назначении учеников:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
