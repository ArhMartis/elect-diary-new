import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups, subjects, teacherSubjects, schedule } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import PrincipalDashboard from "./PrincipalDashboard";

export default async function PrincipalPage() {
  noStore();
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "principal") {
    redirect("/");
  }

  // Получаем всех учителей
  const allTeachers = await db
    .select({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    })
    .from(user)
    .where(eq(user.role, "teacher"));

  // Получаем всех учеников
  const allStudents = await db
    .select({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      groupId: user.groupId,
    })
    .from(user)
    .where(eq(user.role, "student"));

  // Получаем все классы
  const allGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      teacherId: groups.teacherId,
    })
    .from(groups);

  // Получаем связи учителей с предметами
  const allTeacherSubjects = await db
    .select({
      teacherId: teacherSubjects.teacherId,
      subjectId: teacherSubjects.subjectId,
      subjectName: subjects.name,
    })
    .from(teacherSubjects)
    .leftJoin(subjects, eq(teacherSubjects.subjectId, subjects.id));

  // Получаем расписание для подсчета часов
  const allSchedule = await db
    .select({
      teacherId: schedule.teacherId,
      subjectId: schedule.subjectId,
    })
    .from(schedule);

  // Формируем данные для учителей
  const teachersWithDetails = allTeachers.map((teacher) => {
    const teacherSubs = allTeacherSubjects.filter((ts) => ts.teacherId === teacher.id);
    const teacherSchedule = allSchedule.filter((s) => s.teacherId === teacher.id);
    const classTeacherGroup = allGroups.find((g) => g.teacherId === teacher.id);
    
    return {
      id: teacher.id,
      fullName: teacher.fullName,
      email: teacher.email,
      isClassTeacher: !!classTeacherGroup,
      className: classTeacherGroup?.name,
      subjects: teacherSubs.map((ts) => ({ id: ts.subjectId, name: ts.subjectName || "" })),
      hoursCount: teacherSchedule.length,
    };
  });

  // Формируем данные для учеников
  const studentsWithGroups = allStudents.map((student) => {
    const group = allGroups.find((g) => g.id === student.groupId);
    return {
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      groupId: student.groupId,
      groupName: group?.name,
    };
  });

  // Формируем данные для классов
  const groupsWithDetails = await Promise.all(
    allGroups.map(async (group) => {
      const groupStudents = studentsWithGroups.filter((s) => s.groupId === group.id);
      const classTeacher = allTeachers.find((t) => t.id === group.teacherId);
      
      const groupSchedule = await db
        .select({
          subjectId: schedule.subjectId,
          subjectName: subjects.name,
          teacherId: schedule.teacherId,
          teacherName: user.fullName,
        })
        .from(schedule)
        .leftJoin(subjects, eq(schedule.subjectId, subjects.id))
        .leftJoin(user, eq(schedule.teacherId, user.id))
        .where(eq(schedule.groupId, group.id));

      const uniqueSubjects = groupSchedule.reduce((acc, curr) => {
        if (!acc.find((s) => s.id === curr.subjectId)) {
          acc.push({
            id: curr.subjectId,
            name: curr.subjectName || "",
            teacherName: curr.teacherName || "",
          });
        }
        return acc;
      }, [] as { id: number; name: string; teacherName: string }[]);

      return {
        id: group.id,
        name: group.name,
        teacherId: group.teacherId,
        teacherName: classTeacher?.fullName,
        students: groupStudents,
        subjects: uniqueSubjects,
      };
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Навигация */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4-.001z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Панель директора</h1>
                <p className="text-gray-700 font-medium">{session.user.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-all font-bold shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                На главную
              </Link>
            </div>
          </div>
        </div>

        {/* Дашборд с тремя формами */}
        <PrincipalDashboard
          teachers={teachersWithDetails}
          students={studentsWithGroups}
          groups={groupsWithDetails}
        />
      </div>
    </div>
  );
}
