"use server";

import { db } from "@/db";
import { subjects } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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
