import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardRouter() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Неавторизованный вообще не должен сюда попадать
  if (!session) {
    redirect("/sign-in");
  }

  const role = session.user.role;

  // 👉 маршрутизация по ролям
  switch (role) {
    case "student":
      redirect("/student");

    case "teacher":
      redirect("/teacher");

    case "admin":
      redirect("/admin");

    case "parent":
      redirect("/parent");

    default:
      // если вдруг роль сломалась
      redirect("/");
  }
}
