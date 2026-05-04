"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user, parentsToStudents } from "@/db/schema/auth_schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ==========================
// СОЗДАНИЕ СВЯЗИ
// ==========================
export async function linkParentToStudent(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const parentId = formData.get("parentId") as string;
  const studentId = formData.get("studentId") as string;

  if (!parentId || !studentId) {
    throw new Error("Некорректные данные");
  }

  const parentUser = await db
    .select()
    .from(user)
    .where(eq(user.id, parentId))
    .get();

  const studentUser = await db
    .select()
    .from(user)
    .where(eq(user.id, studentId))
    .get();

  if (!parentUser || parentUser.role !== "parent") {
    throw new Error("Выбранный пользователь не является родителем");
  }

  if (!studentUser || studentUser.role !== "student") {
    throw new Error("Можно привязать только ученика");
  }

  const existing = await db
    .select()
    .from(parentsToStudents)
    .where(
      and(
        eq(parentsToStudents.parentId, parentId),
        eq(parentsToStudents.studentId, studentId)
      )
    )
    .get();

  if (existing) {
    throw new Error("Связь уже существует");
  }

  // Проверяем, не превышен ли лимит в 3 родителя на ученика
  const currentParentsCount = await db
    .select({ count: sql`count(*)` })
    .from(parentsToStudents)
    .where(eq(parentsToStudents.studentId, studentId))
    .get();

  if (currentParentsCount && currentParentsCount.count >= 3) {
    throw new Error("Ученик не может иметь более 3 родителей");
  }

  await db.insert(parentsToStudents).values({
    parentId,
    studentId,
  });

  revalidatePath("/admin/parent-student-links");
}

// ==========================
// УДАЛЕНИЕ СВЯЗИ
// ==========================
export async function unlinkParentFromStudent(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const linkId = formData.get("linkId") as string;

  if (!linkId) {
    throw new Error("Некорректные данные");
  }

  await db
    .delete(parentsToStudents)
    .where(eq(parentsToStudents.id, parseInt(linkId)));

  revalidatePath("/admin/parent-student-links");
}
