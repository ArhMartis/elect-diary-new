import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups, subjects, teacherSubjects } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { assignSubjectToTeacher, removeSubjectFromTeacher, assignClassToTeacher } from "./actions";

// Иконки ролей
const roleIcons: Record<string, string> = {
  admin: "👑",
  principal: "🎓",
  teacher: "👨‍🏫",
  student: "🎒",
  parent: "👨‍👩‍👧",
};

export default async function TeacherClassesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  // Получаем всех учителей
  const teachers = await db.select().from(user).where(eq(user.role, "teacher"));
  
  // Получаем все классы
  const allGroups = await db.select().from(groups);
  
  // Получаем все предметы
  const allSubjects = await db.select().from(subjects);
  
  // Получаем связи учителей с предметами
  const teacherSubjectsList = await db.select().from(teacherSubjects);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок и кнопка назад */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-cyan-200 text-cyan-700 rounded-xl hover:bg-cyan-50 hover:border-cyan-300 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад в админ-панель
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">👨‍🏫 Классы и предметы учителей</h1>
        </div>

        {/* Список учителей */}
        <div className="space-y-6">
          {teachers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="text-6xl mb-4">👨‍🏫</div>
              <p className="text-gray-700 text-lg font-medium">Учителя ещё не добавлены</p>
            </div>
          ) : (
            teachers.map((teacher) => {
              // Предметы учителя
              const teacherSubjectIds = teacherSubjectsList
                .filter(ts => ts.teacherId === teacher.id)
                .map(ts => ts.subjectId);
              const teacherSubjectsData = allSubjects.filter(s => teacherSubjectIds.includes(s.id));
              
              // Классы учителя (где он классный руководитель)
              const teacherClasses = allGroups.filter(g => g.teacherId === teacher.id);
              
              // Доступные классы (без классного руководителя или текущего учителя)
              const availableGroups = allGroups.filter(g => !g.teacherId || g.teacherId === teacher.id);

              return (
                <div
                  key={teacher.id}
                  className="bg-white rounded-2xl shadow-lg border-2 border-cyan-100 overflow-hidden hover:shadow-xl transition-all"
                >
                  {/* Шапка карточки */}
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{roleIcons.teacher}</span>
                        <h2 className="text-xl font-bold text-white">{teacher.fullName}</h2>
                      </div>
                      <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                        {teacher.email}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Классное руководство - ТОЛЬКО ПРОСМОТР, без удаления */}
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <h3 className="text-lg font-bold text-emerald-800 mb-3 flex items-center gap-2">
                        <span className="text-2xl">🍎</span>
                        Классное руководство
                      </h3>
                      
                      {teacherClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {teacherClasses.map((group) => (
                            <div
                              key={group.id}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-bold"
                            >
                              <span>🎓 {group.name}</span>
                              <span className="text-xs text-emerald-600 bg-white px-2 py-0.5 rounded-full">
                                Назначено в разделе &quot;Классы&quot;
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-emerald-700 italic mb-3 font-medium">Классное руководство не назначено</p>
                      )}

                      {/* Назначить класс */}
                      <form action={assignClassToTeacher} className="flex gap-2 items-center">
                        <input type="hidden" name="teacherId" value={teacher.id} />
                        <select
                          name="groupId"
                          className="border-2 border-emerald-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-emerald-500 bg-white flex-1 font-medium"
                          defaultValue=""
                        >
                          <option value="" disabled>Выберите класс</option>
                          {availableGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              🎓 {group.name} {group.teacherId && group.teacherId !== teacher.id ? "(уже имеет классного руководителя)" : "(свободен)"}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-bold"
                        >
                          Назначить
                        </button>
                      </form>
                    </div>

                    {/* Предметы */}
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                      <h3 className="text-lg font-bold text-indigo-800 mb-3 flex items-center gap-2">
                        <span className="text-2xl">📚</span>
                        Преподаваемые предметы
                      </h3>
                      
                      {teacherSubjectsData.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {teacherSubjectsData.map((subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-bold"
                            >
                              <span>📖 {subject.name}</span>
                              <form action={removeSubjectFromTeacher}>
                                <input type="hidden" name="teacherId" value={teacher.id} />
                                <input type="hidden" name="subjectId" value={subject.id} />
                                <button
                                  type="submit"
                                  className="text-indigo-600 hover:text-indigo-900 ml-2"
                                  title="Удалить предмет"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </form>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-indigo-700 italic mb-3 font-medium">Предметы не назначены</p>
                      )}

                      {/* Назначить предмет */}
                      <form action={assignSubjectToTeacher} className="flex gap-2 items-center">
                        <input type="hidden" name="teacherId" value={teacher.id} />
                        <select
                          name="subjectId"
                          className="border-2 border-indigo-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-indigo-500 bg-white flex-1 font-medium"
                          defaultValue=""
                        >
                          <option value="" disabled>Выберите предмет</option>
                          {allSubjects
                            .filter(s => !teacherSubjectIds.includes(s.id))
                            .map((subject) => (
                              <option key={subject.id} value={subject.id}>
                                📖 {subject.name}
                              </option>
                            ))}
                        </select>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-bold"
                        >
                          Добавить
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
