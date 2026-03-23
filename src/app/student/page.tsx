import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { grades, subjects, user, schedule, groups } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import StudentDiary from "@/components/StudentDiary";
import { posts } from "@/db/schema/posts";
import { desc } from "drizzle-orm";

export default async function StudentPage() {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "student") {
    redirect("/");
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
    .where(eq(grades.studentId, session.user.id));

  // Получаем класс ученика
  const student = await db.select().from(user).where(eq(user.id, session.user.id)).then((res) => res[0]);
  const studentGroup = student?.groupId
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

  // ===== расчет среднего балла =====
  const numericGrades = studentGrades
    .map((g) => Number(g.value))
    .filter((v) => !isNaN(v));

  const average =
    numericGrades.length > 0
      ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
      : null;

  // Получаем новости (посты)
  const recentPosts = await db.query.posts.findMany({
    orderBy: [desc(posts.createdAt)],
    limit: 3,
    with: {
      author: true,
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Верхняя панель с информацией об ученике */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Электронный дневник</h1>
              {studentGroup && (
                <p className="text-blue-100 text-sm">Класс: {studentGroup.name}</p>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {average !== null && (
                <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/30">
                  <div className="text-xs text-blue-100">Средний балл</div>
                  <div className="text-3xl font-bold">{average.toFixed(2)}</div>
                </div>
              )}
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-all font-medium shadow-md"
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
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Новости школы */}
        {recentPosts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Новости школы</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 hover:shadow-md transition-all"
                >
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{post.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(post.createdAt!).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                    <span className="text-blue-600 font-medium">
                      {post.author?.name || "Администрация"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Дневник */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 4.804l7.686 7.686a1.125 1.125 0 01-1.59 1.59L10 8.907 1.214 17.686a1.125 1.125 0 01-1.59-1.59L9 4.804z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Мой дневник</h2>
          </div>
          <StudentDiary
            grades={studentGrades}
            studentId={session.user.id}
            currentUserId={session.user.id}
            isTeacher={false}
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
