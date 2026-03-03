"use server";

import { db } from "@/db";
import { user, groups } from "@/db/schema/auth_schema";
import { diaryNotes, diaryVerification, parentVerification } from "@/db/schema/diary";
import { eq, and, inArray } from "drizzle-orm";

export async function getStudentDiary(studentId: string) {
  return await db.query.user.findFirst({
    where: eq(user.id, studentId),
    with: {
      gradesReceived: {
        with: {
          subject: true,
          teacher: true,
        },
      },
    },
  });
}

/* =====================================================
   ЗАМЕТКИ УЧЕНИКА
   ===================================================== */

export async function saveDiaryNote(studentId: string, weekStart: string, note: string) {
  const now = new Date();
  
  // Проверяем, есть ли уже заметка для этой недели
  const existing = await db.query.diaryNotes.findFirst({
    where: and(
      eq(diaryNotes.studentId, studentId),
      eq(diaryNotes.weekStart, weekStart)
    ),
  });

  if (existing) {
    // Обновляем заметку
    await db.update(diaryNotes)
      .set({ 
        note,
      })
      .where(
        and(
          eq(diaryNotes.studentId, studentId),
          eq(diaryNotes.weekStart, weekStart)
        )
      );
  } else {
    // Создаём новую заметку
    await db.insert(diaryNotes).values({
      studentId,
      weekStart,
      note,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { success: true };
}

export async function getDiaryNote(studentId: string, weekStart: string) {
  const note = await db.query.diaryNotes.findFirst({
    where: and(
      eq(diaryNotes.studentId, studentId),
      eq(diaryNotes.weekStart, weekStart)
    ),
  });

  return note?.note ?? null;
}

/* =====================================================
   ВЕРИФИКАЦИЯ КЛАССНЫМ РУКОВОДИТЕЛЕМ
   ===================================================== */

/**
 * Проверка, является ли учитель классным руководителем ученика
 */
export async function isTeacherHomeroomTeacher(teacherId: string, studentId: string): Promise<boolean> {
  const student = await db.query.user.findFirst({
    where: eq(user.id, studentId),
  });

  if (!student?.groupId) return false;

  const studentGroup = await db.query.groups.findFirst({
    where: eq(groups.id, student.groupId),
  });

  return studentGroup?.teacherId === teacherId;
}

export async function verifyDiaryWeek(teacherId: string, studentId: string, weekStart: string) {
  const now = new Date();

  // Проверяем, является ли учитель классным руководителем этого ученика
  const isHomeroomTeacher = await isTeacherHomeroomTeacher(teacherId, studentId);

  if (!isHomeroomTeacher) {
    return { success: false, error: "Вы не являетесь классным руководителем этого ученика" };
  }

  // Проверяем, есть ли уже верификация
  const existing = await db.query.diaryVerification.findFirst({
    where: and(
      eq(diaryVerification.studentId, studentId),
      eq(diaryVerification.weekStart, weekStart)
    ),
  });

  if (existing) {
    // Уже верифицировано
    return { success: true, alreadyVerified: true };
  }

  // Создаём верификацию
  await db.insert(diaryVerification).values({
    studentId,
    weekStart,
    teacherId,
    verifiedAt: now,
  });

  return { success: true };
}

export async function getDiaryVerification(studentId: string, weekStart: string) {
  const verification = await db.query.diaryVerification.findFirst({
    where: and(
      eq(diaryVerification.studentId, studentId),
      eq(diaryVerification.weekStart, weekStart)
    ),
  });

  return verification ?? null;
}

/* =====================================================
   ПОЛУЧЕНИЕ УЧЕНИКОВ КЛААСНОГО РУКОВОДИТЕЛЯ
   ===================================================== */

export async function getTeacherStudents(teacherId: string) {
  // Получаем класс, которым руководит учитель
  const teacherGroup = await db.query.groups.findFirst({
    where: eq(groups.teacherId, teacherId),
  });

  if (!teacherGroup) {
    return [];
  }

  // Получаем всех учеников этого класса
  const students = await db.query.user.findMany({
    where: eq(user.groupId, teacherGroup.id),
  });

  return students;
}

/* =====================================================
   ВЕРИФИКАЦИЯ РОДИТЕЛЕМ
   ===================================================== */

/**
 * Проверка, является ли пользователь родителем ученика
 */
export async function isUserParentOfStudent(parentId: string, studentId: string): Promise<boolean> {
  const { parentsToStudents } = await import("@/db/schema/auth_schema");
  
  const link = await db.query.parentsToStudents.findFirst({
    where: and(
      eq(parentsToStudents.parentId, parentId),
      eq(parentsToStudents.studentId, studentId)
    ),
  });

  return !!link;
}

/**
 * Подтверждение просмотра дневника родителем
 */
export async function verifyDiaryByParent(parentId: string, studentId: string, weekStart: string) {
  const now = new Date();

  // Проверяем, является ли пользователь родителем этого ученика
  const isParent = await isUserParentOfStudent(parentId, studentId);

  if (!isParent) {
    return { success: false, error: "Вы не являетесь родителем этого ученика" };
  }

  // Проверяем, есть ли уже верификация
  const existing = await db.query.parentVerification.findFirst({
    where: and(
      eq(parentVerification.studentId, studentId),
      eq(parentVerification.weekStart, weekStart)
    ),
  });

  if (existing) {
    // Уже верифицировано
    return { success: true, alreadyVerified: true };
  }

  // Создаём верификацию
  await db.insert(parentVerification).values({
    studentId,
    weekStart,
    parentId,
    verifiedAt: now,
  });

  return { success: true };
}

/**
 * Получение верификации родителем
 */
export async function getParentVerification(studentId: string, weekStart: string) {
  const verification = await db.query.parentVerification.findFirst({
    where: and(
      eq(parentVerification.studentId, studentId),
      eq(parentVerification.weekStart, weekStart)
    ),
  });

  return verification ?? null;
}
