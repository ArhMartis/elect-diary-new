import { db } from "@/db";
import { subjects } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSubject } from "./actions";
import Link from "next/link";

export default async function SubjectsAdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allSubjects = await db.select().from(subjects);

  return (
    <div className="p-6 space-y-6">
      <Link href="/admin" className="underline">← Назад</Link>

      <h1 className="text-2xl font-bold">Управление предметами</h1>

      {/* Форма добавления */}
      <form action={createSubject} className="flex gap-4">
        <input
          name="name"
          placeholder="Название предмета"
          className="border p-2 rounded"
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Добавить
        </button>
      </form>

      {/* Список предметов */}
      <div className="space-y-2">
        {allSubjects.map((s) => (
          <div key={s.id} className="p-2 border rounded">
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}