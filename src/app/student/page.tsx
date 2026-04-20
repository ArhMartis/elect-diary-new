import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function StudentPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const userRole = session.user.role || "student";

  if (userRole === "admin") {
    redirect("/admin");
  }

  if (userRole === "teacher") {
    redirect("/diary");
  }

  redirect("/diary");
}
