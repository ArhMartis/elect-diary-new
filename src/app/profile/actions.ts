"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const fullName = formData.get("fullName") as string;

  if (!fullName || fullName.trim().length === 0) {
    return;
  }

  try {
    await db
      .update(user)
      .set({ fullName: fullName.trim() })
      .where(eq(user.id, session.user.id));
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
  }
  
  redirect("/profile");
}
