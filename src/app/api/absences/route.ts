import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { absences, attendanceRecords } from "@/db/schema/diary-extra";
import { eq, and } from "drizzle-orm";

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${year + 1}`;
}

function getMonthName(date: Date): string {
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  return months[date.getMonth()];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("studentId");
    const date = searchParams.get("date");
    const subjectId = searchParams.get("subjectId");

    // Если указан только studentId (без date, без subjectId) — возвращаем все записи
    if (studentId && !date && !subjectId) {
      const records = await db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.studentId, studentId));
      return NextResponse.json(records);
    }

    // Если указаны дата и предмет (без studentId) — возвращаем все записи за этот урок
    if (date && subjectId && !studentId) {
      const records = await db
        .select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.date, date),
          eq(attendanceRecords.subjectId, parseInt(subjectId))
        ));
      return NextResponse.json(records);
    }

    if (!studentId) {
      return NextResponse.json({ error: "Не указан studentId" }, { status: 400 });
    }

    // Запрос за конкретной датой + предметом (для одного ученика)
    if (date && subjectId) {
      const records = await db
        .select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.studentId, studentId),
          eq(attendanceRecords.date, date),
          eq(attendanceRecords.subjectId, parseInt(subjectId))
        ));
      return NextResponse.json(records);
    }

    // Запрос за конкретной датой (все записи ученика)
    if (date) {
      const records = await db
        .select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.studentId, studentId),
          eq(attendanceRecords.date, date)
        ));
      return NextResponse.json(records);
    }

    // Получаем пропуски по месяцам
    const absencesList = await db
      .select()
      .from(absences)
      .where(eq(absences.studentId, studentId));

    return NextResponse.json(absencesList);
  } catch (error) {
    console.error("Ошибка при получении данных о пропусках:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, subjectId, date, type, month, total, unexcused } = body;

    // Дневная посещаемость
    if (date && type && studentId && subjectId) {
      // Upsert: вставляем или обновляем запись
      const existing = await db.query.attendanceRecords.findFirst({
        where: and(
          eq(attendanceRecords.studentId, studentId),
          eq(attendanceRecords.subjectId, subjectId),
          eq(attendanceRecords.date, date)
        ),
      });

      if (existing) {
        await db
          .update(attendanceRecords)
          .set({ type })
          .where(eq(attendanceRecords.id, existing.id));
      } else {
        await db.insert(attendanceRecords).values({
          studentId,
          subjectId,
          date,
          type,
        });
      }

      return NextResponse.json({ success: true });
    }

    // Месячная статистика пропусков
    if (!studentId || !month || total === undefined || unexcused === undefined) {
      return NextResponse.json(
        { error: "Заполните все обязательные поля" },
        { status: 400 }
      );
    }

    const academicYear = getCurrentAcademicYear();

    const existing = await db.query.absences.findFirst({
      where: and(
        eq(absences.studentId, studentId),
        eq(absences.month, month),
        eq(absences.academicYear, academicYear)
      ),
    });

    if (existing) {
      await db
        .update(absences)
        .set({ total, unexcused })
        .where(eq(absences.id, existing.id));
    } else {
      await db.insert(absences).values({
        studentId,
        month,
        academicYear,
        total,
        unexcused,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при сохранении данных о пропусках:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
