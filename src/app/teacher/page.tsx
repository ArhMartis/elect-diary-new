import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

export default async function TeacherPage() {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "teacher") {
    redirect("/");
  }

  const teacherGroup = await db.query.groups.findFirst({
    where: eq(groups.teacherId, session.user.id),
  });

  let students: typeof user.$inferSelect[] = [];

  if (teacherGroup) {
    students = await db
      .select()
      .from(user)
      .where(eq(user.groupId, teacherGroup.id));
  }

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
                <div className="flex items-center gap-2 mt-1">
                  {teacherGroup && (
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {teacherGroup.name}
                    </span>
                  )}
                  <span className="text-gray-600 text-sm">
                    Вы классный руководитель этого класса
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-purple-700 font-bold">
                    {session.user.fullName}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/teacher/select-class"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Изменить класс
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
          {!teacherGroup ? (
            <div className="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed border-purple-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="font-medium">У вас нет закрепленного класса!</p>
              <p className="text-sm mt-1">Обратитесь к администратору для назначения класса</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center text-gray-500 py-8 bg-white rounded-xl border border-dashed border-purple-200">
              У вас пока нет учеников в классе
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/diary?studentId=${student.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {student.fullName?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">
                        {student.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{teacherGroup.name}</p>
                    </div>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
