import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { groups, user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { createGroup, assignClassTeacher, assignStudentToGroup, removeClassTeacher, removeStudentFromGroup } from "./actions";
import AssignTeacherForm from "./AssignTeacherForm";
import { unstable_noStore as noStore } from "next/cache";

export default async function GroupsPage() {
  noStore();

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const teachers = await db
    .select()
    .from(user)
    .where(eq(user.role, "teacher"));

  const students = await db
    .select()
    .from(user)
    .where(eq(user.role, "student"));

  const groupsList = await db.select().from(groups);
  const studentsWithoutGroup = students.filter((s) => !s.groupId);

  const assignedTeacherIds = new Set(
    groupsList.filter(g => g.teacherId).map(g => g.teacherId!)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Заголовок и кнопка назад с фоном */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад в админ-панель
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">🎓 Классы</h1>
        </div>

        {/* Список классов */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Список классов</h2>
          
          {groupsList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="text-6xl mb-4">🎓</div>
              <p className="text-gray-700 text-lg font-medium">Классы ещё не созданы</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {groupsList.map((group) => {
                const homeroomTeacher = teachers.find(t => t.id === group.teacherId);
                const classStudents = students.filter(s => s.groupId === group.id);
                
                return (
                  <div
                    key={group.id}
                    className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all"
                  >
                    {/* Шапка карточки класса */}
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🎓</span>
                          <h3 className="text-2xl font-bold text-white">{group.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-bold">
                            👥 {classStudents.length} учеников
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {/* Классный руководитель */}
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <p className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
                          <span>🍎</span> Классный руководитель
                        </p>
                        {homeroomTeacher ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">👨‍🏫</span>
                              <span className="font-bold text-emerald-800">{homeroomTeacher.fullName}</span>
                            </div>
                            <form action={removeClassTeacher}>
                              <input type="hidden" name="groupId" value={group.id} />
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-bold"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Удалить
                              </button>
                            </form>
                          </div>
                        ) : (
                          <div>
                            <p className="text-amber-700 font-bold mb-3">⚠️ Классный руководитель не назначен</p>
                            <AssignTeacherForm
                              groupId={group.id}
                              availableTeachers={teachers.filter(t => !assignedTeacherIds.has(t.id)).map(t => ({ id: t.id, fullName: t.fullName }))}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Ученики класса */}
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <p className="text-sm font-bold text-purple-800 mb-3 flex items-center gap-2">
                          <span>🎒</span> Ученики класса
                        </p>
                        {classStudents.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {classStudents.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between gap-2 px-3 py-2 bg-white text-purple-800 rounded-lg text-sm font-bold border border-purple-200 shadow-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span>👤</span>
                                  <span>{student.fullName}</span>
                                </div>
                                <form action={removeStudentFromGroup}>
                                  <input type="hidden" name="studentId" value={student.id} />
                                  <button
                                    type="submit"
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-all"
                                    title="Удалить из класса"
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
                          <p className="text-purple-700 font-bold">В классе пока нет учеников</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Создать новый класс */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
          <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
            <span>➕</span> Создать новый класс
          </h3>
          <form action={createGroup} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Название класса
              </label>
              <input
                type="text"
                name="name"
                placeholder="Например: 5-А"
                className="w-full border-2 border-blue-200 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
            >
              Создать
            </button>
          </form>
        </div>

        {/* Распределить учеников без класса */}
        {studentsWithoutGroup.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-6">
            <h3 className="text-xl font-bold text-amber-700 mb-4 flex items-center gap-2">
              <span>⚠️</span> Распределить учеников без класса 
              <span className="ml-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-bold">
                {studentsWithoutGroup.length}
              </span>
            </h3>
            <form action={assignStudentToGroup} className="space-y-3">
              {studentsWithoutGroup.map((student) => (
                <div key={student.id} className="flex gap-3 items-center bg-amber-50 rounded-lg p-3">
                  <span className="text-lg">👤</span>
                  <span className="font-bold text-gray-800 flex-1">{student.fullName}</span>
                  <select
                    name={`student-${student.id}`}
                    className="border-2 border-amber-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-amber-500 bg-white"
                    defaultValue=""
                  >
                    <option value="" disabled>Выберите класс</option>
                    {groupsList.map((group) => (
                      <option key={group.id} value={group.id}>
                        🎓 {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
              >
                Распределить всех
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
