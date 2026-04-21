import { db } from "@/db";
import { posts } from "@/db/schema/posts";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function PostsPage() {
  const allPosts = await db.query.posts.findMany({
    orderBy: [desc(posts.createdAt)],
    with: {
      author: true,
    }
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Лента постов
          </h1>
          <p className="text-gray-600 text-lg">Последние новости и события</p>
        </div>

        {allPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allPosts.map((post) => (
              <div key={post.id} className="card bg-white/80 backdrop-blur-sm shadow-xl border border-white/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="card-body">
                  <h2 className="card-title text-primary">{post.title}</h2>
                  <p className="line-clamp-3 text-base-content/80">{post.content}</p>

                  <div className="flex items-center gap-2 mt-4">
                    <div className="avatar placeholder">
                      <div className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white rounded-full w-8">
                        <span>{post?.authorId?.charAt(0) || "U"}</span>
                      </div>
                    </div>
                    <span className="text-sm opacity-70">Автор: {post.authorId || "Аноним"}</span>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-gradient btn-sm btn-primary">Читать далее</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {allPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="card bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-indigo-100 w-full max-w-lg">
              <figure className="px-10 pt-10">
                <div className="text-8xl mb-4">📝</div>
              </figure>
              <div className="card-body items-center text-center">
                <h2 className="card-title text-2xl text-indigo-700">Постов пока нет</h2>
                <p className="text-gray-500 py-4">Создайте первый пост, чтобы начать</p>
                <div className="card-actions">
                  <Link href="/posts/newpost" className="btn btn-gradient btn-primary btn-lg gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Создать пост
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}