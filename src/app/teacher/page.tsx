import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, subjects } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { addGrade } from "./actions";
import { unstable_noStore as noStore } from "next/cache";
import { requireRole, getClassTeacherGroup } from "@/lib/rbac";


export default async function TeacherPage() {
  noStore();
  // 🔐 Проверка доступа
  const userSession = await requireRole(["teacher", "principal", "admin"]);
  const classGroup = await getClassTeacherGroup(userSession.id);

  // 📚 Получаем учеников
  const students = await db.query.user.findMany({
  where: (u, { eq }) => eq(u.role, "student"),
});

  // 📘 Получаем предметы
  const allSubjects = await db.select().from(subjects);

  return (
<div className="p-6 space-y-6">

  <h1 className="text-3xl font-bold">Журнал преподавателя</h1>

  <div className="card bg-base-100 shadow-xl">
    <div className="card-body">
      <h2 className="card-title">Выставить оценку</h2>

  {classGroup && (
  <div className="alert alert-info">
    Вы классный руководитель класса {classGroup.name}
  </div>
)}

      <form action={addGrade} className="grid md:grid-cols-2 gap-4">

        {/* Ученик */}
  <select
  name="studentId"
  className="select select-bordered"
  required
>
  <option value="">Выберите ученика</option>
  {students.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name} ({s.email})
    </option>
  ))}
</select>


        {/* Предмет */}
        <select name="subjectId" className="select select-bordered" required>
          <option value="">Выберите предмет</option>
          {allSubjects.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name}</option>
          ))}
        </select>

        {/* Оценка */}
        <select name="value" className="select select-bordered" required>
          {[10,9,8,7,6,5,4,3,2,1].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
          <option value="Н">Неявка</option>
        </select>

        {/* Комментарий */}
        <input
          name="comment"
          placeholder="Комментарий"
          className="input input-bordered"
        />

        <button className="btn btn-primary md:col-span-2">
          Сохранить
        </button>

      </form>
    </div>
  </div>

</div>
  );
}
