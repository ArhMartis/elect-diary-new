"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { roles, type Role } from "@/db/schema/auth_schema";


// ==========================
// СМЕНА РОЛИ
// ==========================
export async function changeRole(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const userId = formData.get("userId") as string;
  const role = formData.get("role");

  if (!roles.includes(role as Role)) {
    throw new Error("Некорректная роль");
  }

  if (userId === session.user.id) {
    throw new Error("Нельзя менять свою роль");
  }

  await db
    .update(user)
    .set({ role: role as Role })
    .where(eq(user.id, userId));

  revalidatePath("/admin");
}