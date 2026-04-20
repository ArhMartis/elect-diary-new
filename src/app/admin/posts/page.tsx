import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { posts } from "@/db/schema/posts";
import { desc } from "drizzle-orm";

export default async function PostsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Получаем все посты
  const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Кнопка Назад с фоном */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-teal-200 text-teal-700 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад в админ-панель
          </Link>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📰 Управление постами</h1>
          <p className="text-gray-600">Создавайте и управляйте новостями и объявлениями</p>
        </div>

        {/* Кнопка создания поста */}
        <div className="flex justify-center mb-8">
          <Link
            href="/posts/newpost"
            className="btn btn-primary gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Создать новый пост
          </Link>
        </div>

        {/* Список постов */}
        <div className="space-y-4">
          {allPosts.length === 0 ? (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="card-title text-2xl">Постов пока нет</h2>
                <p className="text-gray-500">Создайте первый пост, чтобы начать</p>
                <div className="card-actions mt-4">
                  <Link href="/posts/newpost" className="btn btn-primary">
                    Создать пост
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            allPosts.map((post) => (
              <div key={post.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="card-title text-xl">{post.title}</h2>
                      <p className="text-gray-600 mt-2 line-clamp-2">{post.content}</p>
                      <div className="flex gap-2 mt-3">
                        <div className="badge badge-outline">
                          {new Date(post.createdAt).toLocaleDateString("ru-RU")}
                        </div>
                        {post.published ? (
                          <div className="badge badge-success">✅ Опубликован</div>
                        ) : (
                          <div className="badge badge-warning">📝 Черновик</div>
                        )}
                      </div>
                    </div>
                    <div className="card-actions ml-4">
                      <Link
                        href={`/posts/${post.id}`}
                        className="btn btn-sm btn-info"
                      >
                        👁️ Просмотр
                      </Link>
                      <Link
                        href={`/posts/${post.id}/edit`}
                        className="btn btn-sm btn-warning"
                      >
                        ✏️ Редактировать
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Статистика */}
        {allPosts.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="stat-title">Всего постов</div>
                <div className="stat-value text-primary">{allPosts.length}</div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-success">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="stat-title">Опубликовано</div>
                <div className="stat-value text-success">
                  {allPosts.filter((p) => p.published).length}
                </div>
              </div>
            </div>
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-figure text-warning">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="stat-title">Черновиков</div>
                <div className="stat-value text-warning">
                  {allPosts.filter((p) => !p.published).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
