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

export async function assignStudentToGroup(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const groupId = formData.get("groupId");

  if (!groupId) {
    await db
      .update(user)
      .set({ groupId: null })
      .where(eq(user.id, studentId));
    await setFlash("Ученик удалён из класса");
  } else {
    const groupIdNum = Number(groupId);
    await db
      .update(user)
      .set({ groupId: groupIdNum })
      .where(eq(user.id, studentId));
    await setFlash("Ученик назначен в класс");
  }

  revalidatePath("/admin/groups");
}

