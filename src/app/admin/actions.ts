"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";

export async function makeAdmin(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Нет прав");
  }

  const userId = formData.get("userId") as string;

  await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.id, userId));
}
