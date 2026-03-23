import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateProfile } from "./actions";
import AvatarUploader from "@/components/AvatarUploader";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок и кнопка назад */}
        <div className="flex items-center gap-4">
          <Link
            href={`/${user.role}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow"
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
          <h1 className="text-3xl font-bold text-gray-800">Мой профиль</h1>
        </div>

        {/* Основная информация */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            Личная информация
          </h2>

          <div className="space-y-6">
            {/* Аватар */}
            <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
              <div>
                <AvatarUploader current={user.avatar ?? undefined} />
              </div>
            </div>

            {/* Форма редактирования профиля */}
            <form action={updateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Логин (имя пользователя)
                </label>
                <input
                  type="text"
                  defaultValue={user.name ?? ""}
                  disabled
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Логин нельзя изменить
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user.email ?? ""}
                  disabled
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email нельзя изменить
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ФИО *
                </label>
                <input
                  name="fullName"
                  type="text"
                  defaultValue={user.fullName ?? ""}
                  placeholder="Иванов Иван Иванович"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Роль
                </label>
                <input
                  type="text"
                  defaultValue={
                    {
                      admin: "Администратор",
                      teacher: "Учитель",
                      student: "Ученик",
                      parent: "Родитель",
                      principal: "Директор",
                    }[user.role as string] || user.role || ""
                  }
                  disabled
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Информация об аккаунте
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Дата регистрации</span>
              <span className="text-gray-800 font-medium">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("ru-RU", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Email подтверждён</span>
              <span
                className={`font-medium ${
                  user.emailVerified
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {user.emailVerified ? "Да" : "Нет"}
              </span>
            </div>

            {user.banned && (
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Статус</span>
                <span className="text-red-600 font-medium">
                  Заблокирован {user.banReason && `(${user.banReason})`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
