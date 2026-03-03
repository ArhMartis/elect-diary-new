import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, subjects, groups, schedule } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { assignSubject } from "./actions";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

export default async function SchedulePage() {
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

  const subjectsList = await db.select().from(subjects);
  const groupsList = await db.select().from(groups);
  const scheduleList = await db.select().from(schedule);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Заголовок и кнопка назад */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm hover:shadow"
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
          <h1 className="text-3xl font-bold text-gray-800">Назначение предметов</h1>
        </div>

        {/* ➕ НАЗНАЧЕНИЕ ПРЕДМЕТА */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Назначить предмет учителю
          </h2>

          <form action={assignSubject} className="grid md:grid-cols-4 gap-4">
            <select name="teacherId" className="select select-bordered text-gray-800 w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 bg-white" required>
              <option value="">Учитель</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select name="subjectId" className="select select-bordered text-gray-800 w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 bg-white" required>
              <option value="">Предмет</option>
              {subjectsList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select name="groupId" className="select select-bordered text-gray-800 w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 bg-white" required>
              <option value="">Класс</option>
              {groupsList.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium">
              Назначить
            </button>
          </form>
        </div>

        {/* 📋 СПИСОК НАЗНАЧЕНИЙ */}
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
            Текущие назначения
          </h2>

          {scheduleList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Учитель</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Предмет</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Класс</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleList.map((s, idx) => {
                    const teacher = teachers.find(t => t.id === s.teacherId);
                    const subject = subjectsList.find(sub => sub.id === s.subjectId);
                    const group = groupsList.find(g => g.id === s.groupId);
                    return (
                      <tr key={s.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="py-3 px-4 text-gray-800">{teacher?.name ?? "—"}</td>
                        <td className="py-3 px-4 text-gray-800">{subject?.name ?? "—"}</td>
                        <td className="py-3 px-4 text-gray-800">{group?.name ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Назначений еще нет</p>
          )}
        </div>
      </div>
    </div>
  );
}
