import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, subjects, groups, grades, schedule } from "@/db/schema/auth_schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import GradesForm from "./GradesForm";

const GRADE_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Н"];

export default async function TeacherGradesPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string; subjectId?: string; date?: string }>;
}) {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "teacher") {
    redirect("/");
  }

  const params = await searchParams;
  const selectedGroupId = params.groupId ? Number(params.groupId) : null;
  const selectedSubjectId = params.subjectId ? Number(params.subjectId) : null;
  const selectedDate = params.date || new Date().toISOString().split("T")[0];

  // Получаем классы, которыми руководит учитель
  const teacherGroups = await db
    .select()
    .from(groups)
    .where(eq(groups.teacherId, session.user.id));

  // Получаем предметы, закреплённые за учителем
  const teacherSubjects = await db
    .select()
    .from(subjects)
    .where(eq(subjects.teacherId, session.user.id));

  // Если учитель не руководит классом, показываем все классы
  const allGroups = teacherGroups.length > 0 ? teacherGroups : await db.select().from(groups);

  // Получаем все предметы (если нет закреплённых)
  const allSubjects = teacherSubjects.length > 0 ? teacherSubjects : await db.select().from(subjects);

  // Получаем учеников выбранного класса
  let students: typeof user.$inferSelect[] = [];
  let selectedGroup: typeof groups.$inferSelect | null = null;

  if (selectedGroupId) {
    selectedGroup = allGroups.find((g) => g.id === selectedGroupId) || null;

    if (selectedGroup) {
      students = await db
        .select()
        .from(user)
        .where(eq(user.groupId, selectedGroupId))
        .orderBy(user.name);
    }
  }

  // Получаем расписание для выбранного класса
  let classSchedule: typeof schedule.$inferSelect[] = [];
  if (selectedGroupId) {
    // Сначала пробуем получить расписание на дату
    const dateObj = selectedDate ? new Date(selectedDate) : new Date();
    const dayOfWeek = dateObj.getDay() || 7; // 1-6, воскресенье = 7

    // Получаем расписание на дату ТОЛЬКО для предметов текущего учителя
    classSchedule = await db
      .select()
      .from(schedule)
      .where(
        and(
          eq(schedule.groupId, selectedGroupId),
          eq(schedule.lessonDate, selectedDate),
          eq(schedule.teacherId, session.user.id)
        )
      );

    // Если нет расписания на дату, берём регулярное расписание по дню недели
    if (classSchedule.length === 0) {
      classSchedule = await db
        .select()
        .from(schedule)
        .where(
          and(
            eq(schedule.groupId, selectedGroupId),
            eq(schedule.dayOfWeek, dayOfWeek),
            eq(schedule.teacherId, session.user.id)
          )
        );
    }

    // Убираем дубликаты по subjectId — оставляем только уникальные предметы
    const uniqueSubjects = new Map<number, typeof schedule.$inferSelect>();
    for (const item of classSchedule) {
      if (!uniqueSubjects.has(item.subjectId)) {
        uniqueSubjects.set(item.subjectId, item);
      }
    }
    classSchedule = Array.from(uniqueSubjects.values()).sort((a, b) => a.lessonNumber - b.lessonNumber);
  }

  // Получаем уже выставленные оценки за выбранную дату
  let existingGrades: Record<string, { id: number; value: string; comment: string | null }> = {};

  if (selectedGroupId && selectedSubjectId && selectedDate) {
    const classStudents = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.groupId, selectedGroupId));

    const studentIds = classStudents.map((s) => s.id);

    if (studentIds.length > 0) {
      const classGrades = await db
        .select()
        .from(grades)
        .where(
          and(
            eq(grades.subjectId, selectedSubjectId),
            eq(grades.date, selectedDate),
            eq(grades.teacherId, session.user.id)
          )
        );

      existingGrades = classGrades.reduce((acc, grade) => {
        acc[grade.studentId] = {
          id: grade.id,
          value: grade.value,
          comment: grade.comment,
        };
        return acc;
      }, {} as Record<string, { id: number; value: string; comment: string | null }>);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Навигация и заголовок */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/teacher"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
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
                Назад к дневнику
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Выставление оценок</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Массовое выставление оценок классу
                </p>
              </div>
            </div>
          </div>
        </div>

        <GradesForm
          groups={allGroups}
          subjects={allSubjects}
          students={students}
          selectedGroup={selectedGroup}
          selectedGroupId={selectedGroupId}
          selectedSubjectId={selectedSubjectId}
          selectedDate={selectedDate}
          existingGrades={existingGrades}
          teacherId={session.user.id}
          gradeOptions={GRADE_OPTIONS}
          classSchedule={classSchedule}
        />
      </div>
    </div>
  );
}
