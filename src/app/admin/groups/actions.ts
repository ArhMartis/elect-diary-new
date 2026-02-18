"use server";

import { db } from "@/db";
import { groups } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { setFlash } from "@/lib/flash";


export async function createGroup(formData: FormData) {
  const name = formData.get("name") as string;

  await db.insert(groups).values({ name });

  await setFlash("Класс создан");
  revalidatePath("/admin/groups");
}

export async function assignClassTeacher(formData: FormData) {
  const groupId = Number(formData.get("groupId"));
  const teacherId = formData.get("teacherId") as string;

  await db
    .update(groups)
    .set({ teacherId })
    .where(eq(groups.id, groupId));

  await setFlash("Классный руководитель назначен");
  revalidatePath("/admin/groups");
}

