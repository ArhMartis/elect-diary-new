import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups } from "@/db/schema/auth_schema";
import { changeRole } from "./actions";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { roles, type Role } from "@/db/schema/auth_schema";

// Перевод ролей на русский
const roleNames: Record<Role, string> = {
  admin: "Администратор",
  principal: "Директор",
  teacher: "Учитель",
  student: "Ученик",
  parent: "Родитель",
};


export default async function AdminPage() {
  noStore();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.select().from(user);
  const groupsList = await db.select().from(groups);

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
    <div className="relative max-w-6xl mx-auto">

      {/* ЗАГОЛОВОК ПО ЦЕНТРУ */}
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Админ панель
      </h1>

      {/* КНОПКИ УПРАВЛЕНИЯ */}
      <div className="flex justify-center gap-4 mb-10 flex-wrap">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-4 0 3 3 0 014 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Пользователи
        </Link>

        <Link
          href="/admin/subjects"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
          Предметы
        </Link>

        <Link
          href="/admin/schedule/class"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          Расписание
        </Link>

        <Link
          href="/admin/diary"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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
          Дневник
        </Link>

        <Link
          href="/admin/academic-periods"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 011-1h6a1 1 0 011 1v1h1a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h1V2zM7 4h6v1H7V4zm0 3a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Четверти
        </Link>

        <Link
          href="/admin/groups"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Классы
        </Link>

        <Link
          href="/admin/parent-student-links"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
          Связи
        </Link>
      </div>

      {/* СПИСОК ПОЛЬЗОВАТЕЛЕЙ */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Пользователи
        </h2>
        {allUsers.map((u) => {
          const userGroup = u.groupId ? groupsList.find(g => g.id === u.groupId) : null;
          return (
            <div
              key={u.id}
              className="p-4 border border-gray-200 rounded-lg bg-white hover:border-blue-300 hover:bg-blue-50 transition-all flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-800">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
                <p className="text-xs mt-1 text-gray-600">
                  ФИО: <span className="font-medium text-gray-800">{u.fullName || "—"}</span>
                </p>
                <p className="text-xs mt-1 text-gray-600">
                  Роль: <span className="font-medium text-blue-600">{roleNames[u.role as Role]}</span>
                  {userGroup && u.role === "student" && (
                    <span className="ml-2 text-emerald-600">• Класс: {userGroup.name}</span>
                  )}
                </p>
              </div>

              <div className="flex gap-2 items-center">
                {/* КНОПКА ПРОСМОТРА ДНЕВНИКА ДЛЯ УЧЕНИКОВ */}
                {u.role === "student" && (
                  <Link
                    href={`/admin/student/${u.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
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
                    Дневник
                  </Link>
                )}

                {/* НЕЛЬЗЯ МЕНЯТЬ СЕБЯ */}
                {u.id !== session.user.id ? (
                  <form action={changeRole} className="flex gap-2 items-center">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role as Role}
                      className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {roleNames[r]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-md"
                    >
                      Обновить
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-gray-400 italic">Это вы</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
}
