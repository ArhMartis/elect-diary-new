import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { grades, subjects, user, groups, schedule } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import StudentDiary from "@/components/StudentDiary";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminStudentDiaryPage({ params }: PageProps) {
  noStore();
  const { id: studentId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const student = await db
    .select()
    .from(user)
    .where(eq(user.id, studentId))
    .then((res) => res[0]);

  if (!student || student.role !== "student") {
    redirect("/admin");
  }

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
    .where(eq(grades.studentId, studentId));

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
    .where(eq(schedule.groupId, student.groupId || 0))
    .orderBy(schedule.lessonDate, schedule.dayOfWeek, schedule.lessonNumber);

  // ===== расчет среднего балла (игнорируем "Н") =====
  const numericGrades = studentGrades
    .map((g) => Number(g.value))
    .filter((v) => !isNaN(v));

  const average =
    numericGrades.length > 0
      ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Навигация и заголовок */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
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
                Назад к админ-панели
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Дневник ученика</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {student.name}
                  {studentGroup && <span className="ml-2 text-emerald-600">• Класс: {studentGroup.name}</span>}
                </p>
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
            </div>
          </div>
        </div>

        {/* Дневник */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <StudentDiary
            grades={studentGrades}
            studentId={studentId}
            currentUserId={session.user.id}
            isTeacher={true}
            isHomeroomTeacher={false}
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
