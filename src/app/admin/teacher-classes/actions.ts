"use server";

import { db } from "@/db";
import { teacherSubjects, teacherClasses, groups } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function assignSubjectToTeacher(formData: FormData): Promise<void> {
  const teacherId = formData.get("teacherId") as string;
  const subjectId = parseInt(formData.get("subjectId") as string);
  
  if (!teacherId || isNaN(subjectId)) {
    return;
  }

  try {
    const existing = await db.query.teacherSubjects.findFirst({
      where: and(
        eq(teacherSubjects.teacherId, teacherId),
        eq(teacherSubjects.subjectId, subjectId)
      ),
    });

    if (existing) {
      return;
    }

    await db.insert(teacherSubjects).values({
      teacherId,
      subjectId,
    });

    revalidatePath("/admin/teacher-classes");
  } catch (error) {
    console.error("Error assigning subject:", error);
  }
}

export async function removeSubjectFromTeacher(formData: FormData): Promise<void> {
  const teacherId = formData.get("teacherId") as string;
  const subjectId = parseInt(formData.get("subjectId") as string);
  
  if (!teacherId || isNaN(subjectId)) {
    return;
  }

  try {
    await db
      .delete(teacherSubjects)
      .where(
        and(
          eq(teacherSubjects.teacherId, teacherId),
          eq(teacherSubjects.subjectId, subjectId)
        )
      );

    revalidatePath("/admin/teacher-classes");
  } catch (error) {
    console.error("Error removing subject:", error);
  }
}

export async function assignClassToTeacher(formData: FormData) {
  const teacherId = formData.get("teacherId") as string;
  const groupId = parseInt(formData.get("groupId") as string);
  
  if (!teacherId || isNaN(groupId)) {
    return { success: false, error: "Неверные данные" };
  }

  try {
    await db
      .update(groups)
      .set({ teacherId })
      .where(eq(groups.id, groupId));

    revalidatePath("/admin/teacher-classes");
    return { success: true };
  } catch (error) {
    console.error("Error assigning class:", error);
    return { success: false, error: "Ошибка при назначении класса" };
  }
}

export async function removeClassFromTeacher(formData: FormData) {
  const groupId = parseInt(formData.get("groupId") as string);
  
  if (isNaN(groupId)) {
    return { success: false, error: "Неверные данные" };
  }

  try {
    await db
      .update(groups)
      .set({ teacherId: null })
      .where(eq(groups.id, groupId));

    revalidatePath("/admin/teacher-classes");
    return { success: true };
  } catch (error) {
    console.error("Error removing class:", error);
    return { success: false, error: "Ошибка при удалении класса" };
  }
}

export async function assignTeachingClassToTeacher(formData: FormData): Promise<void> {
  const teacherId = formData.get("teacherId") as string;
  const groupId = parseInt(formData.get("groupId") as string);
  
  if (!teacherId || isNaN(groupId)) {
    return;
  }

  try {
    const existing = await db.query.teacherClasses.findFirst({
      where: and(
        eq(teacherClasses.teacherId, teacherId),
        eq(teacherClasses.groupId, groupId)
      ),
    });

    if (existing) {
      return;
    }

    await db.insert(teacherClasses).values({
      teacherId,
      groupId,
    });

    revalidatePath("/admin/teacher-classes");
  } catch (error) {
    console.error("Error assigning teaching class:", error);
  }
}

export async function removeTeachingClassFromTeacher(formData: FormData): Promise<void> {
  const teacherId = formData.get("teacherId") as string;
  const groupId = parseInt(formData.get("groupId") as string);
  
  if (!teacherId || isNaN(groupId)) {
    return;
  }

  try {
    await db
      .delete(teacherClasses)
      .where(
        and(
          eq(teacherClasses.teacherId, teacherId),
          eq(teacherClasses.groupId, groupId)
        )
      );

    revalidatePath("/admin/teacher-classes");
  } catch (error) {
    console.error("Error removing teaching class:", error);
  }
}