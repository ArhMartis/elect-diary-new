import { db } from "@/db";
import { posts } from "@/db/schema/posts";
import { desc } from "drizzle-orm";

export default async function PostsPage() {
  // Получаем посты, свежие — сверху
  const allPosts = await db.query.posts.findMany({
    orderBy: [desc(posts.createdAt)],
    with: {
      author: true, // если настроены relations
    }
  });

  console.log(allPosts);

  return (
    <main className="p-8 bg-base-200 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Лента постов</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPosts.map((post) => (
            <div key={post.id} className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-primary">{post.title}</h2>
                <p className="line-clamp-3 text-base-content/80">{post.content}</p>
                
                <div className="flex items-center gap-2 mt-4">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-8">
                      <span>{post?.authorId || "U"}</span>
                    </div>
                  </div>
                  <span className="text-sm opacity-70">Автор: {post.authorId || "Аноним"}</span>
                </div>

                <div className="card-actions justify-end mt-4">
                  <button className="btn btn-outline btn-sm btn-primary">Читать далее</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {allPosts.length === 0 && (
          <div className="alert alert-info shadow-lg">
            <span>Постов пока нет. Будьте первым!</span>
          </div>
        )}
      </div>
    </main>
  );
}