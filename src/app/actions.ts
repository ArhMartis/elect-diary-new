"use server";

import { db } from "@/db";
import { posts } from "@/db/schema/posts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // В реальном приложении authorId берется из сессии пользователя
  await db.insert(posts).values({
    title,
    content,
    authorId: "iHD6zsLCVPWy70AZnLFJ5uKgF4j4HKJA", // ID существующего пользователя
  });

  // Очищаем кэш страницы со списком постов и перенаправляем
  revalidatePath("/posts");
  redirect("/posts");
}