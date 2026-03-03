"use server";

import { db } from "@/db";
import { subjects } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

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
