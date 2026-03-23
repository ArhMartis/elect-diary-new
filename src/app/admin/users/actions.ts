"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";

export async function updateFullName(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return { error: "Только администратор может изменять данные" };
  }

  const userId = formData.get("userId") as string;
  const fullName = formData.get("fullName") as string;

  if (!userId) {
    return { error: "Не указан пользователь" };
  }

  // Разрешаем пустое значение только если поле уже было заполнено (для редактирования)
  // Но для нового значения требуем заполнение
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!fullName || fullName.trim().length === 0) {
    // Если у пользователя уже было ФИО, разрешаем "очистить" (оставим старое значение)
    // Если не было - требуем заполнить
    if (!currentUser?.fullName || currentUser.fullName.trim().length === 0) {
      return { error: "ФИО является обязательным полем" };
    }
    // Не обновляем ничего, оставляем старое значение
    return { success: "ФИО не изменено" };
  }

  try {
    await db
      .update(user)
      .set({ fullName: fullName.trim() })
      .where(eq(user.id, userId));

    return { success: "ФИО успешно обновлено" };
  } catch (error) {
    console.error("Ошибка обновления ФИО:", error);
    return { error: "Ошибка при обновлении ФИО" };
  }
}
