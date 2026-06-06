import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import HeroCarousel from "@/components/HeroCarousel";
import { db } from "@/db";
import { posts } from "@/db/schema/posts";
import { desc } from "drizzle-orm";

export default async function HomePage() {
  noStore();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user.role ?? "guest";

  // Get posts for display on homepage
  const allPosts = await db.query.posts.findMany({
    orderBy: [desc(posts.createdAt)],
    limit: 6,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Фоновые декоративные элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <main className="relative z-10 container mx-auto px-4 py-16">
        {/* Заголовок с логотипом */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-white"
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
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white tracking-tight break-all sm:break-normal">
              Knowledge<span className="opacity-80">BY</span>
            </h1>
          </div>
          <p className="text-xl text-white/90 font-light max-w-2xl mx-auto">
            Современная платформа для управления учебным процессом
          </p>
        </div>

        {/* Основная карточка */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Добро пожаловать
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Ваша персональная система для отслеживания успеваемости,
                взаимодействия с учителями и контроля учебного процесса
              </p>

              {role !== "guest" && (
                <Link
                  href={role === "parent" ? "/diary" : `/${role}`}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Перейти в личный кабинет
                </Link>
              )}

              {role === "guest" && (
                <div className="space-y-4">
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Войти в систему
                  </Link>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      Используйте учетные данные, предоставленные школой
                    </p>
                    <Link
                      href="/sign-up"
                      className="block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 decoration-indigo-300 hover:decoration-indigo-600 transition-all"
                    >
                      Или зарегистрируйтесь для подтверждения профиля администратором дневника
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Карточки преимуществ */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Успеваемость</h3>
            <p className="text-gray-600">Мгновенный доступ к оценкам и статистике успеваемости в реальном времени</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Взаимодействие</h3>
            <p className="text-gray-600">Удобная связь между учителями, учениками и родителями</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Контроль</h3>
            <p className="text-gray-600">Полная прозрачность учебного процесса для всех участников</p>
          </div>
        </div>

        {/* Карусель фотографий */}
        <HeroCarousel />

        {/* Посты / Новости */}
        <section id="posts-section" className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Новости</h2>
            <p className="text-white/80">Последние события и объявления</p>
          </div>
          
          {allPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {allPosts.map((post) => (
                <div key={post.id} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <h3 className="text-xl font-bold text-indigo-700 mb-3">{post.title}</h3>
                  <p className="text-gray-600 line-clamp-3 mb-4">{post.content}</p>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('ru-RU') : ''}</span>
                    <Link href={`/posts`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                      Читать далее →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {allPosts.length === 0 && (
            <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-2xl max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-white mb-2">Новостей пока нет</h3>
              <p className="text-white/70">Загляните позже для обновлений</p>
            </div>
          )}
        </section>

        {/* Футер */}
        <div className="text-center mt-16 text-white/70 text-sm">
          <p>© 2026 KnowledgeBY. Система электронного дневника</p>
        </div>
      </main>
    </div>
  );
}