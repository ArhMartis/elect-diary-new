import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LogoutButton from "./LogoutButton";
import AccountSwitcher from "./AccountSwitcher";
import Avatar from "./Avatar";
import Drawer from "./Drawer";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function Navbar() {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user.role;

  const roleNames: Record<string, string> = {
    admin: "Админ",
    principal: "Директор",
    teacher: "Учитель",
    student: "Ученик",
    parent: "Родитель",
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Меню + Логотип */}
          <div className="flex items-center">
            <Drawer isLoggedIn={!!session} />
            <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">
              KnowledgeBY
            </span>
          </Link>
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-4">
            {!session && (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-white font-medium hover:bg-white/10 rounded-lg transition-all"
                >
                  Вход
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-md"
                >
                  Регистрация
                </Link>
              </>
            )}

            {session && (
              <div className="flex items-center gap-4">
                {/* Переключатель аккаунтов */}
                <AccountSwitcher />

                {/* Профиль */}
                <Link href="/profile">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl hover:bg-white/20 transition-all cursor-pointer">
                    <Avatar
                      src={session.user.avatar}
                      alt="avatar"
                      fallbackText={session.user.fullName || session.user.name || "U"}
                    />
                    <div className="text-sm leading-tight text-white hidden sm:block">
                      <div className="font-medium">
                        {session.user.fullName || session.user.name || "Пользователь"}
                      </div>
                      <div className="opacity-75 text-xs max-w-[150px] truncate">
                        {session.user.email}
                      </div>
                      {session.user.role && (
                        <div className="opacity-60 text-xs text-gray-200 mt-0.5">
                          {roleNames[session.user.role] || session.user.role}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Кнопка выхода */}
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
