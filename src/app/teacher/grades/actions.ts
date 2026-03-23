"use server";

import { db } from "@/db";
import { grades } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

/* =====================================================
   ДОБАВЛЕНИЕ ОЦЕНКИ УЧЕНИКУ
   ===================================================== */

export async function addGradeToStudent(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "teacher") {
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

  await db.insert(grades).values({
    studentId,
    subjectId: Number(subjectId),
    teacherId,
    value,
    date,
    comment: comment || null,
  });

  revalidatePath("/teacher/grades");
}

/* =====================================================
   МАССОВОЕ ВЫСТАВЛЕНИЕ ОЦЕНОК КЛАССУ
   ===================================================== */

export async function addGradesToClass(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "teacher") {
    throw new Error("Нет прав");
  }

  const subjectId = formData.get("subjectId") as string;
  const teacherId = formData.get("teacherId") as string;
  const date = formData.get("date") as string;

  if (!subjectId || !teacherId || !date) {
    throw new Error("Заполните все обязательные поля");
  }

  // Получаем все оценки из формы (studentId_grade и studentId_comment)
  const entries = Array.from(formData.entries());
  const gradeEntries = entries.filter(([key]) => key.startsWith("grade_"));

  if (gradeEntries.length === 0) {
    throw new Error("Выберите хотя бы одного ученика и оценку");
  }

  // Вставляем или обновляем оценки
  for (const [key, value] of gradeEntries) {
    const studentId = key.replace("grade_", "");
    const commentKey = `comment_${studentId}`;
    const comment = formData.get(commentKey) as string;
    
    if (value && value !== "") {
      // Проверяем, есть ли уже оценка
      const existingGrade = await db.query.grades.findFirst({
        where: and(
          eq(grades.studentId, studentId),
          eq(grades.subjectId, Number(subjectId)),
          eq(grades.date, date),
          eq(grades.teacherId, teacherId)
        ),
      });

      if (existingGrade) {
        // Обновляем существующую оценку
        await db
          .update(grades)
          .set({
            value: value as string,
            comment: comment || null,
          })
          .where(eq(grades.id, existingGrade.id));
      } else {
        // Вставляем новую оценку
        await db.insert(grades).values({
          studentId,
          subjectId: Number(subjectId),
          teacherId,
          value: value as string,
          date,
          comment: comment || null,
        });
      }
    }
  }

  revalidatePath("/teacher/grades");
}

/* =====================================================
   УДАЛЕНИЕ ОЦЕНКИ
   ===================================================== */

export async function deleteGrade(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "teacher") {
    throw new Error("Нет прав");
  }

  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("Некорректные данные");
  }

  await db.delete(grades).where(eq(grades.id, Number(id)));

  revalidatePath("/teacher/grades");
}

/* =====================================================
   ПОЛУЧЕНИЕ ОЦЕНОК КЛАССА
   ===================================================== */

export async function getClassGrades(groupId: number, subjectId?: number, date?: string) {
  const { user: userSchema, subjects } = await import("@/db/schema/auth_schema");

  const studentGrades = await db
    .select({
      id: grades.id,
      studentId: grades.studentId,
      studentName: userSchema.name,
      value: grades.value,
      subjectName: subjects.name,
      date: grades.date,
      comment: grades.comment,
    })
    .from(grades)
    .leftJoin(subjects, eq(grades.subjectId, subjects.id))
    .leftJoin(userSchema, eq(grades.studentId, userSchema.id))
    .where(eq(grades.studentId, userSchema.id));

  return studentGrades;
}
