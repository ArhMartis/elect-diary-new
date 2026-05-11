import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups } from "@/db/schema/auth_schema";
import { changeRole } from "./actions";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";

// Перевод ролей на русский с цветами
const roleConfig: Record<string, { name: string; color: string; icon: string }> = {
  admin: { name: "Администратор", color: "bg-red-100 text-red-700", icon: "👑" },
  principal: { name: "Директор", color: "bg-blue-100 text-blue-700", icon: "🎓" },
  teacher: { name: "Учитель", color: "bg-emerald-100 text-emerald-700", icon: "👨‍🏫" },
  student: { name: "Ученик", color: "bg-purple-100 text-purple-700", icon: "🎒" },
  parent: { name: "Родитель", color: "bg-orange-100 text-orange-700", icon: "👨‍👩‍👧" },
};

// Иконки SVG для кнопок
const icons = {
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  ),
  subjects: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
    </svg>
  ),
  diary: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
    </svg>
  ),
  classes: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
    </svg>
  ),
  teacherClasses: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.356 2.522 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
    </svg>
  ),
  links: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  ),
  posts: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  ),
};

// Цвета для кнопок меню - точно как на скриншоте
const menuButtons = [
  { href: "/admin/users", label: "Пользователи", icon: icons.users, color: "bg-rose-600 hover:bg-rose-700" },
  { href: "/admin/subjects", label: "Предметы", icon: icons.subjects, color: "bg-indigo-600 hover:bg-indigo-700" },
  { href: "/diary", label: "Дневник", icon: icons.diary, color: "bg-emerald-600 hover:bg-emerald-700" },
  { href: "/admin/groups", label: "Классы", icon: icons.classes, color: "bg-blue-600 hover:bg-blue-700" },
  { href: "/admin/teacher-classes", label: "Классы учителей", icon: icons.teacherClasses, color: "bg-cyan-600 hover:bg-cyan-700" },
  { href: "/admin/parent-student-links", label: "Связи", icon: icons.links, color: "bg-amber-600 hover:bg-amber-700" },
  { href: "/admin/posts", label: "Посты", icon: icons.posts, color: "bg-teal-600 hover:bg-teal-700" },
];

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-3 md:p-6">
      <div className="relative max-w-6xl mx-auto">
        
        {/* ЗАГОЛОВОК */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-gray-100 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A10 10 0 0118.834 4.999c.322 1.188.098 2.398-.575 3.395L10 18l-8.259-9.606a4.5 4.5 0 01-.575-3.395z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-gray-800">Админ панель</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-red-700 font-bold text-sm md:text-base">{session.user.fullName}</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Администратор</span>
                </div>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium text-sm"
            >
              На главную
            </Link>
          </div>
        </div>

        {/* КНОПКИ МЕНЮ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center gap-2 md:gap-3 mb-10">
          {menuButtons.map((btn) => (
            <Link
              key={btn.label}
              href={btn.href}
              className={`flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 md:py-3 ${btn.color} text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium text-sm`}
            >
              {btn.icon}
              {btn.label}
            </Link>
          ))}
        </div>

        {/* ЗАГОЛОВОК РАЗДЕЛА */}
        <div className="flex items-center gap-3 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Пользователи</h2>
        </div>

        {/* СПИСОК ПОЛЬЗОВАТЕЛЕЙ */}
        <div className="space-y-3">
          {allUsers.map((u) => {
            const userGroup = u.groupId ? groupsList.find(g => g.id === u.groupId) : null;
            const userRole = u.role as string;
            const roleInfo = roleConfig[userRole] || { name: userRole, color: "bg-gray-100 text-gray-700", icon: "👤" };
            const avatarUrl = u.avatar || u.image;
            
            return (
              <div
                key={u.id}
                className="p-3 md:p-5 border border-gray-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  {/* Левая часть: Аватар + Информация */}
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Аватар */}
                    {avatarUrl ? (
                      <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                        <Image
                          src={avatarUrl}
                          alt={u.fullName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md flex-shrink-0">
                        {roleInfo.icon}
                      </div>
                    )}
                    
                    {/* Информация */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800 text-base md:text-lg truncate">{u.fullName}</p>
                        <span className="text-xl hidden md:inline">{roleInfo.icon}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${roleInfo.color}`}>
                          {roleInfo.name}
                        </span>
                        {userGroup && userRole === "student" && (
                          <span className="text-sm font-bold text-emerald-600">
                            Класс: {userGroup.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Правая часть: Действия */}
                  <div className="flex gap-2 items-center flex-wrap">
                    {/* КНОПКА ДНЕВНИКА ДЛЯ УЧЕНИКОВ */}
                    {userRole === "student" && (
                      <Link
                        href={`/diary?studentId=${u.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Дневник
                      </Link>
                    )}

                    {/* ВЫПАДАЮЩИЙ СПИСОК РОЛИ + КНОПКА ОБНОВИТЬ */}
                    {u.id !== session.user.id ? (
                      <form action={changeRole} className="flex gap-2 items-center flex-wrap">
                        <input type="hidden" name="userId" value={u.id} />
                        <select
                          name="role"
                          defaultValue={u.role as string}
                          className="border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                        >
                          <option value="admin">👑 Админ</option>
                          <option value="principal">🎓 Директор</option>
                          <option value="teacher">👨‍🏫 Учитель</option>
                          <option value="student">🎒 Ученик</option>
                          <option value="parent">👨‍👩‍👧 Родитель</option>
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-md"
                        >
                          Обновить
                        </button>
                      </form>
                    ) : (
                      <span className="text-sm text-gray-500 font-medium">Это вы</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
