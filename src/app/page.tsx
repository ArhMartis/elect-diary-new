import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";


export default async function HomePage() {
  noStore();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user.role ?? "guest";

  return (
    <main className="p-10">
      <div className="hero bg-base-200 rounded-2xl">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold">Добро пожаловать</h1>
            <p className="py-4">
              Цифровой школьный дневник.  
              Оценки, предметы, контроль успеваемости.
            </p>

            {role !== "guest" && (
              <Link href={`/${role}`} className="btn btn-primary">
                Перейти в дневник
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-10">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">📊 Оценки</h2>
            <p>Мгновенный доступ к успеваемости.</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">👨‍🏫 Учителя</h2>
            <p>Выставление оценок и контроль.</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">🏫 Администрирование</h2>
            <p>Управление предметами и связями.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
