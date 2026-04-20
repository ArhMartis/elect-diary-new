"use server";

import { db } from "@/db";
import { teacherSubjects, groups } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function assignSubjectToTeacher(formData: FormData) {
  const teacherId = formData.get("teacherId") as string;
  const subjectId = parseInt(formData.get("subjectId") as string);
  
  if (!teacherId || isNaN(subjectId)) {
    return { success: false, error: "Неверные данные" };
  }

  try {
    // Проверяем, не назначен ли уже этот предмет
    const existing = await db.query.teacherSubjects.findFirst({
      where: and(
        eq(teacherSubjects.teacherId, teacherId),
        eq(teacherSubjects.subjectId, subjectId)
      ),
    });

    if (existing) {
      return { success: false, error: "Предмет уже назначен этому учителю" };
    }

    await db.insert(teacherSubjects).values({
      teacherId,
      subjectId,
    });

    revalidatePath("/admin/teacher-classes");
    return { success: true };
  } catch (error) {
    console.error("Error assigning subject:", error);
    return { success: false, error: "Ошибка при назначении предмета" };
  }
}

export async function removeSubjectFromTeacher(formData: FormData) {
  const teacherId = formData.get("teacherId") as string;
  const subjectId = parseInt(formData.get("subjectId") as string);
  
  if (!teacherId || isNaN(subjectId)) {
    return { success: false, error: "Неверные данные" };
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
    return { success: true };
  } catch (error) {
    console.error("Error removing subject:", error);
    return { success: false, error: "Ошибка при удалении предмета" };
  }
}

export async function assignClassToTeacher(formData: FormData) {
  const teacherId = formData.get("teacherId") as string;
  const groupId = parseInt(formData.get("groupId") as string);
  
  if (!teacherId || isNaN(groupId)) {
    return { success: false, error: "Неверные данные" };
  }

  try {
    // Обновляем группу - назначаем классного руководителя
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
    // Удаляем классного руководителя
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
