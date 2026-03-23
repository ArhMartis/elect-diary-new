"use server";

import { db } from "@/db";
import { subjects, teacherSubjects } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function createSubject(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Только админ может создавать предметы
  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const name = formData.get("name") as string;

  if (!name) throw new Error("Название предмета пустое");

  await db.insert(subjects).values({ name });

  revalidatePath("/admin/subjects");
}

export async function updateSubject(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;

  if (!id || !name) throw new Error("Некорректные данные");

  await db
    .update(subjects)
    .set({ name })
    .where(eq(subjects.id, parseInt(id)));

  revalidatePath("/admin/subjects");
}

export async function deleteSubject(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const id = formData.get("id") as string;

  if (!id) throw new Error("Некорректные данные");

  await db.delete(subjects).where(eq(subjects.id, parseInt(id)));

  revalidatePath("/admin/subjects");
}

export async function assignSubjectToTeacher(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const subjectId = formData.get("subjectId") as string;
  const teacherId = formData.get("teacherId") as string;

  if (!subjectId) throw new Error("Некорректные данные");

  await db
    .update(subjects)
    .set({ teacherId: teacherId || null })
    .where(eq(subjects.id, parseInt(subjectId)));

  revalidatePath("/admin/subjects");
}

/**
 * Закрепить предмет за учителем (добавить в справочник)
 */
export async function assignTeacherToSubject(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const teacherId = formData.get("teacherId") as string;
  const subjectId = formData.get("subjectId") as string;

  if (!teacherId || !subjectId) throw new Error("Некорректные данные");

  // Проверяем, нет ли уже такой записи
  const existing = await db.query.teacherSubjects.findFirst({
    where: and(
      eq(teacherSubjects.teacherId, teacherId),
      eq(teacherSubjects.subjectId, parseInt(subjectId))
    ),
  });

  if (existing) {
    throw new Error("Предмет уже закреплён за этим учителем");
  }

  await db.insert(teacherSubjects).values({
    teacherId,
    subjectId: parseInt(subjectId),
  });

  revalidatePath("/admin/subjects");
}

/**
 * Открепить предмет от учителя (удалить из справочника)
 */
export async function removeTeacherFromSubject(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const teacherId = formData.get("teacherId") as string;
  const subjectId = formData.get("subjectId") as string;

  if (!teacherId || !subjectId) throw new Error("Некорректные данные");

  await db
    .delete(teacherSubjects)
    .where(
      and(
        eq(teacherSubjects.teacherId, teacherId),
        eq(teacherSubjects.subjectId, parseInt(subjectId))
      )
    );

  revalidatePath("/admin/subjects");
}
