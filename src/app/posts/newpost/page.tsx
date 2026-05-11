import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import PostForm from "@/components/PostForm";

export default async function NewPostPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Кнопка назад */}
        <div className="mb-4 md:mb-6">
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 bg-white border-2 border-pink-200 text-pink-700 rounded-xl hover:bg-pink-50 hover:border-pink-300 transition-all shadow-md hover:shadow-lg font-medium text-sm md:text-base"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад
          </Link>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">✨ Создать новый пост</h1>
          <p className="text-gray-600">Поделитесь новостями или важной информацией</p>
        </div>

        {/* Форма */}
        <div className="card bg-white/90 shadow-xl backdrop-blur-sm">
          <div className="card-body">
            <PostForm />
          </div>
        </div>
      </div>
    </div>
  );
}
