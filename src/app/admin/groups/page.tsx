import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { groups, user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { createGroup, assignClassTeacher, assignStudentToGroup, removeClassTeacher } from "./actions";
import { unstable_noStore as noStore } from "next/cache";

export default async function GroupsPage() {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Заголовок и кнопка назад */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm hover:shadow"
          >
            ← Назад
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Классы</h1>
        </div>

        {/* Список классов */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Список классов</h2>
          
          {groupsList.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Классы ещё не созданы</p>
          ) : (
            <div className="grid gap-4">
              {groupsList.map((group) => {
                const homeroomTeacher = teachers.find(t => t.id === group.homeroomTeacherId);
                const classStudents = students.filter(s => s.groupId === group.id);
                
                return (
                  <div
                    key={group.id}
                    className="p-5 bg-white border-2 border-blue-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-blue-700">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Учеников: <span className="font-semibold text-blue-600">{classStudents.length}</span>
                        </p>
                      </div>
                      
                      {/* Кнопка удаления классного руководителя */}
                      {homeroomTeacher && (
                        <form action={removeClassTeacher} className="inline-block">
                          <input type="hidden" name="groupId" value={group.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                            title="Удалить классного руководителя"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Удалить
                          </button>
                        </form>
                      )}
                    </div>
                    
                    {/* Классный руководитель */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Классный руководитель:</p>
                      {homeroomTeacher ? (
                        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg inline-block">
                          <span className="text-lg">👨‍🏫</span>
                          <span className="font-medium text-emerald-700">{homeroomTeacher.fullName}</span>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm italic">Не назначен</p>
                      )}
                    </div>
                    
                    {/* Назначить классного руководителя */}
                    <form action={assignClassTeacher} className="mb-4">
                      <input type="hidden" name="groupId" value={group.id} />
                      <div className="flex gap-2 items-center">
                        <label className="text-sm font-medium text-gray-700">Назначить:</label>
                        <select
                          name="teacherId"
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                          defaultValue=""
                        >
                          <option value="" disabled>Выберите учителя</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.fullName}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                        >
                          Назначить
                        </button>
                      </div>
                    </form>
                    
                    {/* Ученики класса */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Ученики:</p>
                      {classStudents.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {classStudents.map((student) => (
                            <span
                              key={student.id}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                            >
                              {student.fullName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm italic">Нет учеников</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Создать новый класс */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-blue-700 mb-4">Создать новый класс</h3>
          <form action={createGroup} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название класса
              </label>
              <input
                type="text"
                name="name"
                placeholder="Например: 5-А"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md"
            >
              Создать
            </button>
          </form>
        </div>

        {/* Распределить учеников без класса */}
        {studentsWithoutGroup.length > 0 && (
          <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-blue-700 mb-4">
              Распределить учеников без класса ({studentsWithoutGroup.length})
            </h3>
            <form action={assignStudentToGroup} className="space-y-4">
              {studentsWithoutGroup.map((student) => (
                <div key={student.id} className="flex gap-3 items-center">
                  <span className="font-medium text-gray-800 w-48">{student.fullName}</span>
                  <select
                    name={`student-${student.id}`}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Выберите класс</option>
                    {groupsList.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-md"
              >
                Распределить
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
