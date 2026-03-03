import { db } from "@/db";
import { user, parentsToStudents } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { linkParentToStudent } from "./actions";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { LinkItem } from "./LinkItem";

export default async function ParentStudentLinksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.select().from(user);
  const parents = allUsers.filter((u) => u.role === "parent");
  const students = allUsers.filter((u) => u.role === "student");

  // Получаем все существующие связи
  const allLinks = await db.select().from(parentsToStudents);

  // enrich links with parent and student data
  const linksWithUsers = await Promise.all(
    allLinks.map(async (link) => {
      const parent = await db
        .select()
        .from(user)
        .where(eq(user.id, link.parentId))
        .get();
      const student = await db
        .select()
        .from(user)
        .where(eq(user.id, link.studentId))
        .get();
      return {
        ...link,
        parentName: parent?.name ?? "Неизвестно",
        parentEmail: parent?.email ?? "",
        studentName: student?.name ?? "Неизвестно",
        studentEmail: student?.email ?? "",
      };
    })
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 space-y-6">
      {/* Кнопка назад */}
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
        <h1 className="text-3xl font-bold text-gray-800">
          Управление связями родителей и учеников
        </h1>
      </div>

      {/* Форма создания связи */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-emerald-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Создать связь
        </h2>
        <form action={linkParentToStudent} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Родитель
            </label>
            <select
              name="parentId"
              required
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-white"
            >
              <option value="">Выберите родителя</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Ученик
            </label>
            <select
              name="studentId"
              required
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-white"
            >
              <option value="">Выберите ученика</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg font-medium"
          >
            Привязать
          </button>
        </form>
      </div>

      {/* Список связей */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-emerald-600"
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
          Существующие связи
        </h2>
        <div className="space-y-3">
          {linksWithUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Связей еще нет
            </p>
          ) : (
            linksWithUsers.map((link) => (
              <LinkItem key={link.id} link={link} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
