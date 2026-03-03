import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { groups, user } from "@/db/schema/auth_schema";
import { eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { createGroup, assignClassTeacher, assignStudentToGroup } from "./actions";
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Заголовок и кнопка назад */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm hover:shadow"
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
            Назад
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Управление классами</h1>
        </div>

        {/* ➕ СОЗДАНИЕ КЛАССА */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-emerald-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Создать класс
          </h2>

          <form action={createGroup} className="flex gap-4">
            <input
              name="name"
              placeholder="Например: 9-А"
              className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              required
            />
            <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-medium">
              Создать
            </button>
          </form>
        </div>

        {/* 👨‍🏫 НАЗНАЧИТЬ КЛАССНОГО РУКОВОДИТЕЛЯ */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Назначить классного руководителя
          </h2>

          <form action={assignClassTeacher} className="grid md:grid-cols-3 gap-4">
            <select name="groupId" className="select select-bordered text-gray-800 w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 bg-white" required>
              <option value="">Выберите класс</option>
              {groupsList.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <select name="teacherId" className="select select-bordered text-gray-800 w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 bg-white" required>
              <option value="">Выберите учителя</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium">
              Назначить
            </button>
          </form>
        </div>

        {/* 🎓 НАЗНАЧИТЬ УЧЕНИКА В КЛАСС */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            Назначить ученика в класс
          </h2>

          <form action={assignStudentToGroup} className="grid md:grid-cols-3 gap-4">
            <select name="studentId" className="select select-bordered text-gray-800 w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 bg-white" required>
              <option value="">Выберите ученика</option>
              {studentsWithoutGroup.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
              ))}
            </select>

            <select name="groupId" className="select select-bordered text-gray-800 w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-purple-500 bg-white" required>
              <option value="">Выберите класс</option>
              {groupsList.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <button className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg font-medium">
              Назначить
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-3">
            Показаны только ученики без класса
          </p>
        </div>

        {/* 📋 СПИСОК КЛАССОВ С УЧЕНИКАМИ */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-amber-600"
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
            Классы и ученики
          </h2>

          <div className="grid gap-6">
            {groupsList.map(g => {
              const groupStudents = students.filter((s) => s.groupId === g.id);
              const groupTeacher = teachers.find((t) => t.id === g.teacherId);

              return (
                <div key={g.id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:bg-emerald-50 transition-all">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                    <h3 className="text-xl font-bold text-gray-800">{g.name}</h3>
                    <div className="flex items-center gap-2 text-sm bg-emerald-100 px-3 py-1.5 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-emerald-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="text-emerald-700 font-medium">
                        Классный руководитель: {groupTeacher?.name ?? "Не назначен"}
                      </span>
                    </div>
                  </div>

                  {groupStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">ФИО</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Действие</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupStudents.map((s, idx) => (
                            <tr key={s.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                              <td className="py-3 px-4 text-gray-800">{s.name}</td>
                              <td className="py-3 px-4 text-gray-600">{s.email}</td>
                              <td className="py-3 px-4">
                                <form action={assignStudentToGroup} className="inline">
                                  <input type="hidden" name="studentId" value={s.id} />
                                  <input type="hidden" name="groupId" value="" />
                                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium shadow-md">
                                    Удалить из класса
                                  </button>
                                </form>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic py-4">В классе нет учеников</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
