import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { Role } from "./roles";
import { redirect } from "next/navigation";

type AppUser = {
  id: string;
  email: string;
  role?: Role | null;
};

// Получить текущего пользователя
export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role as Role,
  };
}

// Проверка роли
export async function requireRole(allowedRoles: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const role = session.user.role;

  // 🔐 если роль не определена — это ошибка авторизации
  if (!role) {
    redirect("/sign-in");
  }

  if (!allowedRoles.includes(role)) {
    redirect("/");
  }

  // ✅ Возвращаем именно пользователя (НЕ session!)
  return session.user;
}

// Проверка — классный руководитель или нет
export async function getClassTeacherGroup(userId: string) {
  const group = await db.query.groups.findFirst({
    where: (g, { eq }) => eq(g.teacherId, userId),
  });

  return group ?? null;
}
