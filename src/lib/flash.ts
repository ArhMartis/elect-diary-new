"use server";

import { cookies } from "next/headers";

export async function setFlash(message: string) {
  const cookieStore = await cookies(); // ← ВАЖНО

  cookieStore.set("flash", message, {
    maxAge: 2,
    path: "/",
  });
}
