import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { groups, teacherSubjects, teacherClasses, groupSubjects } from "@/db/schema/auth_schema";
import { eq, inArray } from "drizzle-orm";
import Link from "next/link";

export default async function SelectClassPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "teacher") {
    redirect("/");
  }

  // Класс, где учитель классный руководитель
  const teacherGroup = await db.query.groups.findFirst({
    where: eq(groups.teacherId, session.user.id),
  });

  // Классы, где учитель преподает (через teacherSubjects + teacherClasses)
  const teacherSubjectRows = await db.select().from(teacherSubjects).where(eq(teacherSubjects.teacherId, session.user.id));
  const teacherSubjectIds = teacherSubjectRows.map(ts => ts.subjectId);

  const taughtGroupsSet = new Set<number>();
  if (teacherSubjectIds.length > 0) {
    const groupSubjectRows = await db.select().from(groupSubjects).where(
      inArray(groupSubjects.subjectId, teacherSubjectIds)
    );
    groupSubjectRows.forEach(gs => {
      if (gs.groupId) taughtGroupsSet.add(gs.groupId);
    });
  }

  const teacherClassRows = await db.select().from(teacherClasses).where(eq(teacherClasses.teacherId, session.user.id));
  teacherClassRows.forEach(tc => {
    if (tc.groupId) taughtGroupsSet.add(tc.groupId);
  });

  const allAssignedGroups = new Map<number, string>();
  if (teacherGroup) {
    allAssignedGroups.set(teacherGroup.id, teacherGroup.name);
  }
  for (const gid of taughtGroupsSet) {
    if (!allAssignedGroups.has(gid)) {
      const g = await db.query.groups.findFirst({ where: eq(groups.id, gid) });
      if (g) allAssignedGroups.set(g.id, g.name);
    }
  }

  const availableGroups = Array.from(allAssignedGroups.entries())
    .filter(([id, name]) => id > 0 && name && name.trim() !== '')
    .map(([id, name]) => ({ id, name, isHomeroom: id === teacherGroup?.id }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-[#1e1e2e] dark:via-[#181825] dark:to-[#1e1e2e] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#1e1e2e] border-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад к классу
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-[#cdd6f4] mb-2">Выбор класса</h1>
          <p className="text-gray-600 dark:text-[#a6adc8]">Выберите класс для просмотра дневника</p>
        </div>

        <div className="bg-white dark:bg-[#181825] rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-[#45475a]">
          {availableGroups.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-[#585b70]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              <p className="text-gray-500 dark:text-[#a6adc8] text-lg">У вас нет закрепленных классов</p>
              <p className="text-sm text-gray-400 dark:text-[#585b70] mt-2">Обратитесь к администратору</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/teacher?groupId=${group.id}`}
                  className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all group relative ${
                    group.isHomeroom
                      ? "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg"
                      : "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg"
                  }`}
                >
                  {group.isHomeroom && (
                    <span className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-md uppercase tracking-wider">Классный руководитель</span>
                  )}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl mb-3 group-hover:scale-110 transition-transform ${
                    group.isHomeroom
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                      : "bg-gradient-to-br from-purple-500 to-pink-600"
                  }`}>
                    {group.name.charAt(0)}
                  </div>
                  <span className={`font-bold text-center ${
                    group.isHomeroom
                      ? "text-emerald-800 dark:text-emerald-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-200"
                      : "text-gray-800 dark:text-[#cdd6f4] group-hover:text-purple-700 dark:group-hover:text-purple-300"
                  }`}>
                    {group.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
