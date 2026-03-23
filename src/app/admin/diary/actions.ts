"use server";

import { db } from "@/db";
import { grades, user, subjects } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, gte, lte } from "drizzle-orm";

/* =====================================================
   ДОБАВЛЕНИЕ ОЦЕНКИ
   ===================================================== */

export async function addGrade(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const studentId = formData.get("studentId") as string;
  const subjectId = formData.get("subjectId") as string;
  const teacherId = formData.get("teacherId") as string;
  const value = formData.get("value") as string;
  const date = formData.get("date") as string;
  const comment = formData.get("comment") as string;

  if (!studentId || !subjectId || !teacherId || !value || !date) {
    throw new Error("Заполните все обязательные поля");
  }

  // Проверяем, нет ли уже оценки у этого ученика по этому предмету за эту дату
  const existingGrade = await db.query.grades.findFirst({
    where: and(
      eq(grades.studentId, studentId),
      eq(grades.subjectId, Number(subjectId)),
      eq(grades.date, date)
    ),
  });

  if (existingGrade) {
    throw new Error(`У ученика уже есть оценка по этому предмету за ${new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "long" })}. Выберите оценку в списке и измените её.`);
  }

  await db.insert(grades).values({
    studentId,
    subjectId: Number(subjectId),
    teacherId,
    value,
    date,
    comment: comment || null,
  });

  revalidatePath("/admin/diary");
}

/* =====================================================
   ОБНОВЛЕНИЕ ОЦЕНКИ
   ===================================================== */

export async function updateGrade(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const gradeId = formData.get("gradeId") as string;
  const studentId = formData.get("studentId") as string;
  const subjectId = formData.get("subjectId") as string;
  const teacherId = formData.get("teacherId") as string;
  const value = formData.get("value") as string;
  const date = formData.get("date") as string;
  const comment = formData.get("comment") as string;

  if (!gradeId || !studentId || !subjectId || !teacherId || !value || !date) {
    throw new Error("Заполните все обязательные поля");
  }

  await db
    .update(grades)
    .set({
      subjectId: Number(subjectId),
      teacherId,
      value,
      date,
      comment: comment || null,
    })
    .where(eq(grades.id, Number(gradeId)));

  revalidatePath("/admin/diary");
}

/* =====================================================
   УДАЛЕНИЕ ОЦЕНКИ
   ===================================================== */

export async function deleteGrade(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("Некорректные данные");
  }

  await db.delete(grades).where(eq(grades.id, Number(id)));

  revalidatePath("/admin/diary");
}

/* =====================================================
   ПОЛУЧЕНИЕ ОЦЕНОК УЧЕНИКА ЗА ПЕРИОД
   ===================================================== */

export async function getStudentGrades(studentId: string, startDate: string, endDate: string) {
  const studentGrades = await db
    .select({
      id: grades.id,
      value: grades.value,
      subjectName: subjects.name,
      date: grades.date,
      comment: grades.comment,
      teacherName: user.name,
      subjectId: grades.subjectId,
      teacherId: grades.teacherId,
    })
    .from(grades)
    .leftJoin(subjects, eq(grades.subjectId, subjects.id))
    .leftJoin(user, eq(grades.teacherId, user.id))
    .where(
      and(
        eq(grades.studentId, studentId),
        gte(grades.date, startDate),
        lte(grades.date, endDate)
      )
    )
    .orderBy(grades.date);

  return studentGrades;
}
