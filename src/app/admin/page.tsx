import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { changeRole } from "./actions";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import AvatarUploader from "@/components/AvatarUploader";
import { roles, type Role } from "@/db/schema/auth_schema";


export default async function AdminPage() {
  noStore();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.select().from(user);

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
    <div className="relative max-w-6xl mx-auto">

      {/* АВАТАР В ЛЕВОМ ВЕРХНЕМ УГЛУ */}
      <div className="absolute top-0 left-0">
        <AvatarUploader current={session.user.avatar ?? undefined} />
      </div>

      {/* ЗАГОЛОВОК ПО ЦЕНТРУ */}
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Админ панель
      </h1>

      {/* КНОПКИ УПРАВЛЕНИЯ */}
      <div className="flex justify-center gap-4 mb-10">
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
          href="/admin/groups"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
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
        {allUsers.map((u) => (
          <div
            key={u.id}
            className="p-4 border border-gray-200 rounded-lg bg-white hover:border-blue-300 hover:bg-blue-50 transition-all flex justify-between items-center"
          >
            <div>
              <p className="font-medium text-gray-800">{u.name}</p>
              <p className="text-sm text-gray-500">{u.email}</p>
              <p className="text-xs mt-1 text-gray-600">
                Роль: <span className="font-medium text-blue-600">{u.role}</span>
              </p>
            </div>

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
                      {r}
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
        ))}
      </div>
    </div>
  </div>
);
}
