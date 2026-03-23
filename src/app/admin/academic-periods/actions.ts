"use server";

import { db } from "@/db";
import { academicPeriods } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, lte, gte, ne, isNull, or } from "drizzle-orm";

/* =====================================================
   ДОБАВЛЕНИЕ ЧЕТВЕРТИ
   ===================================================== */

export async function addPeriod(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const name = formData.get("name") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const groupId = formData.get("groupId") as string;

  if (!name || !startDate || !endDate) {
    throw new Error("Заполните все поля");
  }

  // Преобразуем пустой groupId в null
  const groupIdValue = groupId && groupId.trim() !== "" ? Number(groupId) : null;

  // Проверяем, нет ли пересекающихся периодов для этого же класса (или общих)
  let whereCondition = and(
    lte(academicPeriods.startDate, endDate),
    gte(academicPeriods.endDate, startDate)
  );

  if (groupIdValue) {
    // Для конкретного класса: проверяем пересечение с общими и для этого класса
    whereCondition = and(
      whereCondition,
      or(
        isNull(academicPeriods.groupId),
        eq(academicPeriods.groupId, groupIdValue)
      )
    );
  } else {
    // Для всех классов: проверяем пересечение только с общими
    whereCondition = and(
      whereCondition,
      isNull(academicPeriods.groupId)
    );
  }

  const existing = await db.query.academicPeriods.findFirst({
    where: whereCondition,
  });

  if (existing) {
    const existingGroup = existing.groupId ? `для класса ${existing.groupId}` : "общая";
    throw new Error(`Период пересекается с существующей четвертью (${existingGroup})`);
  }

  await db.insert(academicPeriods).values({
    name,
    startDate,
    endDate,
    groupId: groupIdValue,
  });

  revalidatePath("/admin/academic-periods");
}

/* =====================================================
   ОБНОВЛЕНИЕ ЧЕТВЕРТИ
   ===================================================== */

export async function updatePeriod(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const groupId = formData.get("groupId") as string;

  if (!id || !name || !startDate || !endDate) {
    throw new Error("Некорректные данные");
  }

  const groupIdValue = groupId && groupId.trim() !== "" ? Number(groupId) : null;

  // Проверяем, нет ли пересекающихся периодов (кроме текущего)
  let whereCondition = and(
    ne(academicPeriods.id, Number(id)),
    lte(academicPeriods.startDate, endDate),
    gte(academicPeriods.endDate, startDate)
  );

  if (groupIdValue) {
    whereCondition = and(
      whereCondition,
      or(
        isNull(academicPeriods.groupId),
        eq(academicPeriods.groupId, groupIdValue)
      )
    );
  } else {
    whereCondition = and(
      whereCondition,
      isNull(academicPeriods.groupId)
    );
  }

  const existing = await db.query.academicPeriods.findFirst({
    where: whereCondition,
  });

  if (existing) {
    const existingGroup = existing.groupId ? `для класса ${existing.groupId}` : "общая";
    throw new Error(`Период пересекается с существующей четвертью (${existingGroup})`);
  }

  await db
    .update(academicPeriods)
    .set({
      name,
      startDate,
      endDate,
      groupId: groupIdValue,
    })
    .where(eq(academicPeriods.id, Number(id)));

  revalidatePath("/admin/academic-periods");
}

/* =====================================================
   УДАЛЕНИЕ ЧЕТВЕРТИ
   ===================================================== */

export async function deletePeriod(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const id = formData.get("id") as string;

  if (!id) {
    throw new Error("Некорректные данные");
  }

  await db.delete(academicPeriods).where(eq(academicPeriods.id, Number(id)));

  revalidatePath("/admin/academic-periods");
}
