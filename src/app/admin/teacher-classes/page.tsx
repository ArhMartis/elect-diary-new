import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeacherClassesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Кнопка Назад */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Назад в админ-панель
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Классы учителей
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Страница в разработке...</p>
        </div>
      </div>
    </div>
  );
}
