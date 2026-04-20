"use server";

import { db } from "@/db";
import { groups, user } from "@/db/schema/auth_schema";
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

export async function removeClassTeacher(formData: FormData) {
  const groupId = Number(formData.get("groupId"));

  await db
    .update(groups)
    .set({ teacherId: null })
    .where(eq(groups.id, groupId));

  await setFlash("Классный руководитель удалён");
  revalidatePath("/admin/groups");
}

export async function assignStudentToGroup(formData: FormData) {
  const entries = Array.from(formData.entries());
  
  for (const [key, value] of entries) {
    if (key.startsWith("student-") && value) {
      const studentId = key.replace("student-", "");
      const groupId = Number(value);
      
      await db
        .update(user)
        .set({ groupId })
        .where(eq(user.id, studentId));
    }
  }

  await setFlash("Ученики распределены по классам");
  revalidatePath("/admin/groups");
}

