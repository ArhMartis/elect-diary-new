import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups, schedule, subjects as subjectsSchema, homework as homeworkSchema } from "@/db/schema/auth_schema";
import { grades, subjects } from "@/db/schema/auth_schema";
import { eq, inArray, desc } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import StudentDiary from "@/components/StudentDiary";
import Link from "next/link";
import { isTeacherHomeroomTeacher } from "@/app/student/actions";
import { addHomework, deleteHomework } from "./actions";

export default async function TeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "teacher") {
    redirect("/");
  }

  const params = await searchParams;
  const selectedStudentId = params.studentId;

  const teacherGroup = await db.query.groups.findFirst({
    where: eq(groups.teacherId, session.user.id),
  });

  // Получаем предметы учителя
  const teacherSubjects = await db
    .select()
    .from(subjectsSchema)
    .where(eq(subjectsSchema.teacherId, session.user.id));

  // Получаем домашние задания учителя
  const teacherHomework = teacherGroup
    ? await db
        .select({
          id: homeworkSchema.id,
          description: homeworkSchema.description,
          lessonDate: homeworkSchema.lessonDate,
          dueDate: homeworkSchema.dueDate,
          createdAt: homeworkSchema.createdAt,
          groupName: groups.name,
          subjectName: subjectsSchema.name,
        })
        .from(homeworkSchema)
        .leftJoin(groups, eq(homeworkSchema.groupId, groups.id))
        .leftJoin(subjectsSchema, eq(homeworkSchema.subjectId, subjectsSchema.id))
        .where(eq(homeworkSchema.teacherId, session.user.id))
        .orderBy(desc(homeworkSchema.createdAt))
    : [];

  let students: typeof user.$inferSelect[] = [];
  let selectedStudent: typeof user.$inferSelect | null = null;
  let studentGrades: {
    id: number;
    value: string;
    subjectName: string | null;
    date: string | null;
    comment: string | null;
    teacherName: string | null;
  }[] = [];

  // Получаем расписание для классов этого учителя
  const scheduleList = teacherGroup
    ? await db
        .select({
          id: schedule.id,
          groupId: schedule.groupId,
          subjectId: schedule.subjectId,
          teacherId: schedule.teacherId,
          lessonDate: schedule.lessonDate,
          dayOfWeek: schedule.dayOfWeek,
          lessonNumber: schedule.lessonNumber,
          subjectName: subjectsSchema.name,
          teacherName: user.name,
          groupName: groups.name,
        })
        .from(schedule)
        .leftJoin(subjectsSchema, eq(schedule.subjectId, subjectsSchema.id))
        .leftJoin(user, eq(schedule.teacherId, user.id))
        .leftJoin(groups, eq(schedule.groupId, groups.id))
        .orderBy(schedule.lessonDate, schedule.dayOfWeek, schedule.lessonNumber)
    : [];

  if (teacherGroup) {
    students = await db
      .select()
      .from(user)
      .where(eq(user.groupId, teacherGroup.id));

    if (selectedStudentId) {
      selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

      if (selectedStudent) {
        studentGrades = await db
          .select({
            id: grades.id,
            value: grades.value,
            subjectName: subjects.name,
            date: grades.date,
            comment: grades.comment,
            teacherName: user.name,
          })
          .from(grades)
          .leftJoin(subjects, eq(grades.subjectId, subjects.id))
          .leftJoin(user, eq(grades.teacherId, user.id))
          .where(eq(grades.studentId, selectedStudent.id));
      }
    }
  }

  const numericGrades = studentGrades
    .map((g) => Number(g.value))
    .filter((v) => !isNaN(v));

  const average =
    numericGrades.length > 0
      ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Навигация */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
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
                <h1 className="text-3xl font-bold text-gray-800">Дневник класса</h1>
                {teacherGroup && (
                  <span className="inline-block mt-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {teacherGroup.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/teacher/grades"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Оценки
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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

        {/* Домашнее задание */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-purple-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            Домашнее задание
          </h2>

          {/* Форма добавления ДЗ */}
          <form action={addHomework} className="mb-6 p-5 bg-white rounded-xl shadow-sm border border-purple-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Класс *
                </label>
                <select
                  name="groupId"
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm"
                >
                  <option value="">Выберите класс</option>
                  {teacherGroup && (
                    <option value={teacherGroup.id}>{teacherGroup.name}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Предмет *
                </label>
                <select
                  name="subjectId"
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm"
                >
                  <option value="">Выберите предмет</option>
                  {teacherSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Дата урока *
                </label>
                <input
                  type="date"
                  name="lessonDate"
                  required
                  className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Задание *
              </label>
              <textarea
                name="description"
                required
                rows={3}
                className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm"
                placeholder="Введите домашнее задание..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Срок выполнения
              </label>
              <input
                type="date"
                name="dueDate"
                className="w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500 shadow-sm"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              Добавить ДЗ
            </button>
          </form>

          {/* Список ДЗ */}
          <div className="space-y-3">
            {teacherHomework.length === 0 ? (
              <div className="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed border-purple-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-3 text-purple-300"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Вы ещё не задавали домашние задания
              </div>
            ) : (
              teacherHomework.map((hw) => (
                <div
                  key={hw.id}
                  className="p-5 bg-white rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-xs font-semibold">
                          {hw.groupName}
                        </span>
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-xs font-semibold">
                          {hw.subjectName}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">
                          📅 Урок: {hw.lessonDate}
                        </span>
                        {hw.dueDate && (
                          <span className="text-sm text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded">
                            ⏰ Срок: {hw.dueDate}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-800 text-base leading-relaxed">{hw.description}</p>
                    </div>
                    <form action={deleteHomework}>
                      <input type="hidden" name="id" value={hw.id} />
                      <button
                        type="submit"
                        className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Удалить"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Список учеников */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-purple-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Ученики класса
          </h2>
          {students.length === 0 ? (
            <div className="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed border-purple-200">
              У вас пока нет учеников в классе
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/teacher?studentId=${student.id}`}
                  className={`px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm ${
                    selectedStudentId === student.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                      : "bg-white text-purple-700 hover:bg-purple-50 border border-purple-200"
                  }`}
                >
                  {student.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Дневник выбранного ученика */}
        {selectedStudent && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedStudent.name}</h2>
              {average !== null && (
                <div className="bg-gradient-to-br from-green-400 to-green-500 text-white px-5 py-3 rounded-xl shadow-lg">
                  <div className="text-xs opacity-90">Средний балл</div>
                  <div className="text-2xl font-bold">{average.toFixed(2)}</div>
                  <div className="text-xs opacity-75">по {numericGrades.length} оценкам</div>
                </div>
              )}
            </div>

            <StudentDiary
              grades={studentGrades}
              studentId={selectedStudent.id}
              currentUserId={session.user.id}
              isTeacher={true}
              isHomeroomTeacher={await isTeacherHomeroomTeacher(session.user.id, selectedStudent.id)}
              schedule={scheduleList
                .filter((s) => s.groupId === selectedStudent.groupId)
                .map((s) => ({
                  id: s.id,
                  lessonNumber: s.lessonNumber,
                  subjectName: s.subjectName,
                  teacherName: s.teacherName,
                  lessonDate: s.lessonDate,
                  dayOfWeek: s.dayOfWeek,
                }))}
            />
          </div>
        )}

        {!selectedStudent && students.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-purple-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-gray-600">Выберите ученика из списка выше для просмотра дневника</p>
          </div>
        )}
      </div>
    </div>
  );
}
