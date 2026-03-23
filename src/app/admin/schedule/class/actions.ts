"use server";

import { db } from "@/db";
import { schedule, subjects, user } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, isNull } from "drizzle-orm";

/* =====================================================
   ДОБАВЛЕНИЕ УРОКА В РАСПИСАНИЕ КЛАССА
   ===================================================== */

export async function addScheduleLesson(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const groupId = formData.get("groupId") as string;
  const subjectId = formData.get("subjectId") as string;
  const teacherId = formData.get("teacherId") as string;
  const lessonDate = formData.get("lessonDate") as string;
  const dayOfWeek = formData.get("dayOfWeek") as string;
  const lessonNumber = formData.get("lessonNumber") as string;
  const name = formData.get("name") as string;

  if (!groupId || !subjectId || !teacherId || !lessonNumber) {
    throw new Error("Заполните все обязательные поля");
  }

  // Преобразуем пустые строки в null
  const dateValue = lessonDate && lessonDate.trim() !== "" ? lessonDate : null;
  const dayValue = dayOfWeek && dayOfWeek.trim() !== "" ? Number(dayOfWeek) : null;
  const nameValue = name && name.trim() !== "" ? name : null;

  if (!dateValue && !dayValue) {
    throw new Error("Укажите дату или день недели");
  }

  // Проверяем, нет ли уже такого урока
  const conditions = [
    eq(schedule.groupId, Number(groupId)),
    eq(schedule.lessonNumber, Number(lessonNumber)),
  ];

  if (dateValue) {
    conditions.push(eq(schedule.lessonDate, dateValue));
  } else {
    conditions.push(isNull(schedule.lessonDate));
    conditions.push(eq(schedule.dayOfWeek, dayValue!));
  }

  const existing = await db.query.schedule.findFirst({
    where: and(...conditions),
  });

  if (existing) {
    throw new Error("Такой урок уже существует в расписании");
  }

  await db.insert(schedule).values({
    groupId: Number(groupId),
    subjectId: Number(subjectId),
    teacherId,
    name: nameValue,
    lessonDate: dateValue,
    dayOfWeek: dayValue,
    lessonNumber: Number(lessonNumber),
  });

  revalidatePath("/admin/schedule/class");
}

/* =====================================================
   УДАЛЕНИЕ УРОКА ИЗ РАСПИСАНИЯ
   ===================================================== */

export async function deleteScheduleLesson(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const id = formData.get("id") as string;
  const date = formData.get("date") as string;
  const groupId = formData.get("groupId") as string;

  // Удаление всех уроков на дату
  if (date && groupId) {
    await db.delete(schedule).where(
      and(
        eq(schedule.groupId, Number(groupId)),
        eq(schedule.lessonDate, date)
      )
    );
    revalidatePath("/admin/schedule/class");
    return;
  }

  // Удаление одного урока
  if (!id) {
    throw new Error("Некорректные данные");
  }

  await db.delete(schedule).where(eq(schedule.id, Number(id)));

  revalidatePath("/admin/schedule/class");
}

/* =====================================================
   ПОЛУЧЕНИЕ РАСПИСАНИЯ ПО КЛАССУ
   ===================================================== */

export async function getScheduleByGroup(groupId: number) {
  const scheduleList = await db
    .select({
      id: schedule.id,
      groupId: schedule.groupId,
      subjectId: schedule.subjectId,
      teacherId: schedule.teacherId,
      name: schedule.name,
      lessonDate: schedule.lessonDate,
      dayOfWeek: schedule.dayOfWeek,
      lessonNumber: schedule.lessonNumber,
    })
    .from(schedule)
    .where(eq(schedule.groupId, groupId))
    .orderBy(schedule.lessonDate, schedule.dayOfWeek, schedule.lessonNumber);

  return scheduleList;
}
