import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { groups, user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { createGroup, assignClassTeacher } from "./actions";
import { unstable_noStore as noStore } from "next/cache";

export default async function GroupsPage() {
  noStore();

  // 🔐 Проверка доступа — только admin
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  
  // 👨‍🏫 Все учителя
  const teachers = await db
    .select()
    .from(user)
    .where(eq(user.role, "teacher"));

  // 🏫 Все классы
  const groupsList = await db.select().from(groups);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Управление классами</h1>

      {/* ➕ СОЗДАНИЕ КЛАССА */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Создать класс</h2>

          <form action={createGroup} className="flex gap-4">
            <input
              name="name"
              placeholder="Например: 9-А"
              className="input input-bordered"
              required
            />

            <button className="btn btn-primary">
              Создать
            </button>
          </form>
        </div>
      </div>

      {/* 👨‍🏫 НАЗНАЧИТЬ КЛАССНОГО РУКОВОДИТЕЛЯ */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Назначить классного руководителя</h2>

          <form action={assignClassTeacher} className="grid md:grid-cols-3 gap-4">

            <select name="groupId" className="select select-bordered" required>
              <option value="">Выберите класс</option>
              {groupsList.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <select name="teacherId" className="select select-bordered" required>
              <option value="">Выберите учителя</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <button className="btn btn-secondary">
              Назначить
            </button>

          </form>
        </div>
      </div>

      {/* 📋 СПИСОК КЛАССОВ */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Список классов</h2>

          <table className="table">
            <thead>
              <tr>
                <th>Класс</th>
                <th>ID классного руководителя</th>
              </tr>
            </thead>
            <tbody>
              {groupsList.map(g => (
                <tr key={g.id}>
                  <td>{g.name}</td>
                  <td>{g.teacherId ?? "Не назначен"}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
