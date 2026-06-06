import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups, subjects, teacherSubjects, teacherClasses, schedule, groupSubjects } from "@/db/schema/auth_schema";
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

  // Получаем расписание для подсчета часов (по четвертям)
  const allSchedule = await db
    .select({
      groupId: schedule.groupId,
      subjectId: schedule.subjectId,
      quarter: schedule.quarter,
    })
    .from(schedule);

  // Получаем связи учителей с классами (где преподают)
  const allTeacherClasses = await db.select().from(teacherClasses);

  // Определяем текущую четверть
  function getCurrentQuarter(): number {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();
    // Q1: Sep 1 - Nov 3 (месяцы 8,9,10 до 3 ноя)
    // Q2: Nov 4 - Dec 31 (месяцы 10 с 4 ноя, 11)
    // Q3: Jan 9 - Mar 23 (месяцы 0 с 9 янв, 1, 2 до 23 мар)
    // Q4: Mar 24 - May 31 (месяцы 2 с 24 мар, 3, 4, 5 до 31 мая)
    if (month >= 8) return 1; // Sep-Dec (Q1 until Nov 3, Q2 after)
    if (month === 10 && day <= 3) return 1; // Nov 1-3 still Q1
    if (month === 10) return 2; // Nov 4+ is Q2
    if (month === 11) return 2; // December is Q2
    if (month === 0 && day < 9) return 2; // Jan 1-8 still holidays (Q2)
    if (month === 0) return 3; // Jan 9+ is Q3
    if (month === 1) return 3; // Feb is Q3
    if (month === 2 && day <= 23) return 3; // Mar 1-23 is Q3
    if (month === 2) return 4; // Mar 24+ is Q4
    if (month === 3 || month === 4) return 4; // Apr-May is Q4
    if (month === 5) return 4; // June is still Q4 (until summer)
    if (month >= 6) return 1; // July-Aug - between years, default Q1
    return 1;
  }
  const currentQuarter = getCurrentQuarter();

  // Формируем данные для учителей
  const teachersWithDetails = allTeachers.map((teacher) => {
    const teacherSubs = allTeacherSubjects.filter((ts) => ts.teacherId === teacher.id);
    const teacherSubjectIds = new Set(teacherSubs.map((ts) => ts.subjectId));
    
    // Классы где учитель преподает: классное руководство + teacherClasses
    const homeroomGroups = allGroups.filter((g) => g.teacherId === teacher.id);
    const teachingClassEntries = allTeacherClasses.filter((tc) => tc.teacherId === teacher.id);
    const teachingGroupIds = teachingClassEntries.map((tc) => tc.groupId);
    const teacherGroupIds = new Set([...homeroomGroups.map((g) => g.id), ...teachingGroupIds]);
    
    // Все классы учителя с подробностями
    const allTeacherGroups = Array.from(teacherGroupIds).map((gid) => {
      const g = allGroups.find((gr) => gr.id === gid);
      return {
        id: gid,
        name: g?.name || "",
        isHomeroom: homeroomGroups.some((hg) => hg.id === gid),
      };
    });
    
    // Расписание учителя (для каждой четверти)
    const teacherScheduleEntries = allSchedule.filter((s) => {
      return teacherSubjectIds.has(s.subjectId) && teacherGroupIds.has(s.groupId);
    });
    
    // Часы за текущую четверть
    const hoursCount = teacherScheduleEntries.filter((s) => s.quarter === currentQuarter || s.quarter === null).length;
    
    const classTeacherGroup = allGroups.find((g) => g.teacherId === teacher.id);
    
    return {
      id: teacher.id,
      fullName: teacher.fullName,
      email: teacher.email,
      isClassTeacher: !!classTeacherGroup,
      className: classTeacherGroup?.name,
      subjects: teacherSubs.map((ts) => ({ id: ts.subjectId, name: ts.subjectName || "" })),
      hoursCount,
      currentQuarter,
      classes: allTeacherGroups,
      scheduleEntries: teacherScheduleEntries.map((s) => ({
        groupId: s.groupId,
        subjectId: s.subjectId,
        quarter: s.quarter,
      })),
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
      
      // Получаем предметы класса через groupSubjects + имена учителей через teacherSubjects
      const gsRows = await db.select().from(groupSubjects).where(eq(groupSubjects.groupId, group.id));
      const gsSubjectIds = gsRows.map(gs => gs.subjectId);
      
      const uniqueSubjects: { id: number; name: string; teacherName: string; type: string | null }[] = [];
      for (const sid of gsSubjectIds) {
        const subject = await db.query.subjects.findFirst({ where: eq(subjects.id, sid) });
        if (!subject) continue;
        const noTeacherTypes = ['class_hour', 'event'];
        let teacherName = '';
        if (!noTeacherTypes.includes(subject.type || '')) {
          const tsRows = await db.select().from(teacherSubjects).where(eq(teacherSubjects.subjectId, sid));
          const names = tsRows.map(ts => allTeachers.find(t => t.id === ts.teacherId)?.fullName).filter(Boolean);
          teacherName = names.join(', ');
        }
        uniqueSubjects.push({
          id: subject.id,
          name: subject.name,
          teacherName,
          type: subject.type,
        });
      }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#1e1e2e] dark:via-[#181825] dark:to-[#1e1e2e] p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Навигация */}
        <div className="bg-white dark:bg-[#1e1e2e] rounded-xl shadow-lg p-6 border border-gray-100 dark:border-[#45475a]">
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-[#cdd6f4]">Панель директора</h1>
                <p className="text-gray-700 dark:text-[#a6adc8] font-medium">{session.user.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-3 bg-gray-100 dark:bg-[#313244] text-gray-800 dark:text-[#cdd6f4] rounded-xl hover:bg-gray-200 dark:hover:bg-[#45475a] transition-all font-bold shadow-md"
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
