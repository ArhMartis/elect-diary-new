import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { parentsToStudents, user, grades, subjects, schedule, groups } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import StudentDiary from "@/components/StudentDiary";
import Link from "next/link";

export default async function ParentPage() {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "parent") {
    redirect("/");
  }

  const link = await db
    .select()
    .from(parentsToStudents)
    .where(eq(parentsToStudents.parentId, session.user.id))
    .get();

  if (!link) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-amber-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Нет привязанного ученика</h1>
          <p className="text-gray-600 mb-6">
            Обратитесь к администратору для привязки ученика к вашему аккаунту
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-medium"
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
    );
  }

  const student = await db
    .select()
    .from(user)
    .where(eq(user.id, link.studentId))
    .get();

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Ученик не найден</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all font-medium"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  // Получаем класс ученика
  const studentGroup = student.groupId
    ? await db.select().from(groups).where(eq(groups.id, student.groupId)).then((res) => res[0])
    : null;

  // Получаем расписание для класса ученика
  const scheduleList = await db
    .select({
      id: schedule.id,
      groupId: schedule.groupId,
      subjectId: schedule.subjectId,
      teacherId: schedule.teacherId,
      lessonDate: schedule.lessonDate,
      dayOfWeek: schedule.dayOfWeek,
      lessonNumber: schedule.lessonNumber,
      subjectName: subjects.name,
      teacherName: user.name,
      groupName: groups.name,
    })
    .from(schedule)
    .leftJoin(subjects, eq(schedule.subjectId, subjects.id))
    .leftJoin(user, eq(schedule.teacherId, user.id))
    .leftJoin(groups, eq(schedule.groupId, groups.id))
    .orderBy(schedule.lessonDate, schedule.dayOfWeek, schedule.lessonNumber);

  // Получаем оценки ученика
  const studentGrades = await db
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
    .where(eq(grades.studentId, student.id));

  // ===== расчет среднего балла =====
  const numericGrades = studentGrades
    .map((g) => Number(g.value))
    .filter((v) => !isNaN(v));

  const average =
    numericGrades.length > 0
      ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Навигация */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Дневник ученика</h1>
                <p className="text-gray-600">{student.name}</p>
                {studentGroup && (
                  <p className="text-sm text-gray-500 mt-1">Класс: {studentGroup.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {average !== null && (
                <div className="bg-gradient-to-br from-green-400 to-green-500 text-white px-5 py-3 rounded-xl shadow-lg">
                  <div className="text-xs opacity-90">Средний балл</div>
                  <div className="text-2xl font-bold">{average.toFixed(2)}</div>
                  <div className="text-xs opacity-75">по {numericGrades.length} оценкам</div>
                </div>
              )}

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

        {/* Дневник ученика */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <StudentDiary
            grades={studentGrades}
            studentId={student.id}
            currentUserId={session.user.id}
            isTeacher={false}
            isParent={true}
            schedule={scheduleList.map((s) => ({
              id: s.id,
              lessonNumber: s.lessonNumber,
              subjectName: s.subjectName,
              teacherName: s.teacherName,
              lessonDate: s.lessonDate,
              dayOfWeek: s.dayOfWeek,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
