"use server";

import { db } from "@/db";
import { posts } from "@/db/schema/posts";
import { session as sessionTable } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const ses = await auth.api.getSession({
    headers: await headers(),
  });

  if (!ses) {
    throw new Error("Нет авторизации");
  }

  await db.insert(posts).values({
    title,
    content,
    authorId: ses.user.id,
  });

  revalidatePath("/");       // обновляем главную страницу
  redirect("/");
}

/* =====================================================
   ВЫХОД ИЗ АККАУНТА
   ===================================================== */

export async function logout(allDevices = false) {
  const ses = await auth.api.getSession({
    headers: await headers(),
  });

  if (allDevices && ses?.user.id) {
    await db.delete(sessionTable).where(eq(sessionTable.userId, ses.user.id));
  } else {
    await auth.api.signOut({
      headers: await headers(),
    });
  }

  redirect("/");
}