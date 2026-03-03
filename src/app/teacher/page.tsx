import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups } from "@/db/schema/auth_schema";
import { grades, subjects } from "@/db/schema/auth_schema";
import { eq, inArray } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import AvatarUploader from "@/components/AvatarUploader";
import StudentDiary from "@/components/StudentDiary";
import Link from "next/link";
import { isTeacherHomeroomTeacher } from "@/app/student/actions";

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
              <AvatarUploader current={session?.user.avatar ?? undefined} />
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

        {/* Список учеников */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
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
            <div className="text-center text-gray-500 py-8">
              У вас пока нет учеников в классе
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/teacher?studentId=${student.id}`}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedStudentId === student.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
