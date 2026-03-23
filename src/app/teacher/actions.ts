"use server";

import { db } from "@/db";
import { posts } from "@/db/schema/posts";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { grades, homework } from "@/db/schema/auth_schema";
import { requireRole } from "@/lib/rbac";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

/* =====================================================
   СОЗДАНИЕ НОВОСТИ (общешкольный лендинг)
   ===================================================== */
export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    throw new Error("Заполните все поля");
  }

  // В реальном приложении authorId берём из сессии
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Нет авторизации");
  }

  await db.insert(posts).values({
    title,
    content,
    authorId: session.user.id,
  });

  revalidatePath("/");       // обновляем главную страницу
  redirect("/");
}

export async function addGrade(formData: FormData) {
  const teacher = await requireRole(["teacher", "principal", "admin"]);

  const studentId = formData.get("studentId") as string;
  const subjectId = Number(formData.get("subjectId"));
  const value = formData.get("value") as string;
  const comment = formData.get("comment") as string;

  await db.insert(grades).values({
    studentId,
    subjectId,
    teacherId: teacher.id,
    value,
    comment,
  });

  // ✅ В Next 15 cookies — async
  const cookieStore = await cookies();

  cookieStore.set("flash", "Оценка успешно выставлена", {
    path: "/",
    maxAge: 2,
  });

  revalidatePath("/teacher");
}

/* =====================================================
   ДОМАШНЕЕ ЗАДАНИЕ (CRUD)
   ===================================================== */

export async function addHomework(formData: FormData) {
  const teacher = await requireRole(["teacher", "principal", "admin"]);

  const groupId = Number(formData.get("groupId"));
  const subjectId = Number(formData.get("subjectId"));
  const lessonDate = formData.get("lessonDate") as string;
  const description = formData.get("description") as string;
  const dueDate = formData.get("dueDate") as string | null;

  if (!groupId || !subjectId || !lessonDate || !description) {
    throw new Error("Заполните обязательные поля");
  }

  await db.insert(homework).values({
    teacherId: teacher.id,
    groupId,
    subjectId,
    lessonDate,
    description,
    dueDate: dueDate || null,
  });

  const cookieStore = await cookies();
  cookieStore.set("flash", "Домашнее задание добавлено", {
    path: "/",
    maxAge: 2,
  });

  revalidatePath("/teacher");
}

export async function updateHomework(formData: FormData) {
  const teacher = await requireRole(["teacher", "principal", "admin"]);

  const id = Number(formData.get("id"));
  const description = formData.get("description") as string;
  const dueDate = formData.get("dueDate") as string | null;

  if (!id || !description) {
    throw new Error("Заполните обязательные поля");
  }

  await db
    .update(homework)
    .set({
      description,
      dueDate: dueDate || null,
    })
    .where(eq(homework.id, id));

  const cookieStore = await cookies();
  cookieStore.set("flash", "Домашнее задание обновлено", {
    path: "/",
    maxAge: 2,
  });

  revalidatePath("/teacher");
}

export async function deleteHomework(formData: FormData) {
  const teacher = await requireRole(["teacher", "principal", "admin"]);

  const id = Number(formData.get("id"));

  await db
    .delete(homework)
    .where(eq(homework.id, id));

  const cookieStore = await cookies();
  cookieStore.set("flash", "Домашнее задание удалено", {
    path: "/",
    maxAge: 2,
  });

  revalidatePath("/teacher");
}


/* =====================================================
   ВЫХОД ИЗ АККАУНТА
   ===================================================== */
export async function logout() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/");
}
