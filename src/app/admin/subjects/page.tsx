import { db } from "@/db";
import { subjects, user, teacherSubjects, groups } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SubjectsAdminPage from "./SubjectsAdminPageClient";

export default async function SubjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allSubjects = await db.select().from(subjects);
  const teachers = await db.select().from(user).where(eq(user.role, "teacher"));
  const classesList = await db.select().from(groups);
  const allTeacherSubjects = await db.select().from(teacherSubjects);

  return (
    <SubjectsAdminPage
      allSubjectsData={allSubjects}
      teachersData={teachers}
      classesData={classesList}
      teacherSubjectsData={allTeacherSubjects}
    />
  );
}
