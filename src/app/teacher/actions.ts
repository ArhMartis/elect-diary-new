"use server";

import { db } from "@/db";
import { posts } from "@/db/schema/posts";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { grades } from "@/db/schema/auth_schema";
import { requireRole } from "@/lib/rbac";
import { cookies } from "next/headers";

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
   ВЫХОД ИЗ АККАУНТА
   ===================================================== */
export async function logout() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/");
}
