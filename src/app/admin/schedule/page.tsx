import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, subjects, groups, schedule } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { assignSubject } from "./actions";
import { unstable_noStore as noStore } from "next/cache";

export default async function SchedulePage() {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const teachers = await db
    .select()
    .from(user)
    .where(eq(user.role, "teacher"));

  const subjectsList = await db.select().from(subjects);
  const groupsList = await db.select().from(groups);
  const scheduleList = await db.select().from(schedule);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Назначение предметов</h1>

      {/* ➕ НАЗНАЧЕНИЕ ПРЕДМЕТА */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Назначить предмет учителю</h2>

          <form action={assignSubject} className="grid md:grid-cols-4 gap-4">

            <select name="teacherId" className="select select-bordered" required>
              <option value="">Учитель</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <select name="subjectId" className="select select-bordered" required>
              <option value="">Предмет</option>
              {subjectsList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select name="groupId" className="select select-bordered" required>
              <option value="">Класс</option>
              {groupsList.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>

            <button className="btn btn-primary">
              Назначить
            </button>

          </form>
        </div>
      </div>

      {/* 📋 СПИСОК НАЗНАЧЕНИЙ */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Текущие назначения</h2>

          <table className="table">
            <thead>
              <tr>
                <th>TeacherId</th>
                <th>SubjectId</th>
                <th>GroupId</th>
              </tr>
            </thead>
            <tbody>
              {scheduleList.map(s => (
                <tr key={s.id}>
                  <td>{s.teacherId}</td>
                  <td>{s.subjectId}</td>
                  <td>{s.groupId}</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
