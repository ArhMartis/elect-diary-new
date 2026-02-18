import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { grades, subjects } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";


export default async function StudentPage() {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "student") {
    redirect("/");
  }

  const studentGrades = await db
    .select({
      id: grades.id,
      value: grades.value,
      subjectName: subjects.name,
      date: grades.date,
      comment: grades.comment,
    })
    .from(grades)
    .leftJoin(subjects, eq(grades.subjectId, subjects.id))
    .where(eq(grades.studentId, session.user.id));

    // ===== расчет среднего балла (игнорируем "Н") =====
const numericGrades = studentGrades
  .map((g) => Number(g.value))
  .filter((v) => !isNaN(v)); // убираем "Н"

const average =
  numericGrades.length > 0
    ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
    : null;

  return (
  <div className="p-6 space-y-6">
    {/* Навигация */}
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold">Мои оценки</h1>
      {average !== null && (
  <div className="mb-4">
    <div className="stats shadow">
      <div className="stat">
        <div className="stat-title">Средний балл</div>
        <div className="stat-value">
          {average.toFixed(2)}
        </div>
        <div className="stat-desc">
          по {numericGrades.length} оценкам
        </div>
      </div>
    </div>
  </div>
)}


      <Link href="/" className="btn btn-outline">
        ← На главную
      </Link>
    </div>

    {/* Карточка дневника */}
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">

        {studentGrades.length === 0 ? (
          <div className="text-center text-gray-500">
            Пока нет выставленных оценок
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-lg">
              <thead>
                <tr>
                  <th>📘 Предмет</th>
                  <th>📊 Оценка</th>
                  <th>💬 Комментарий</th>
                  <th>📅 Дата</th>
                </tr>
              </thead>

              <tbody>
                {studentGrades.map((grade) => (
                  <tr key={grade.id}>
                    <td className="font-medium">
                      {grade.subjectName}
                    </td>

                    <td>
{(() => {
  const numeric = Number(grade.value);

  let color = "badge-neutral";

  if (!isNaN(numeric)) {
    if (numeric === 10) color = "badge-success";        // ярко-зеленая
    else if (numeric >= 7) color = "badge-primary";     // зеленая
    else if (numeric >= 4) color = "badge-warning";     // желтая
    else color = "badge-error";                         // красная
  } else {
    // Н — неявка
    color = "badge-info";
  }

  return (
    <span className={`badge badge-lg ${color}`}>
      {grade.value}
    </span>
  );
})()}

                    </td>
                      <td className="text-sm">
                         {grade.comment ? (
                           <span className="italic opacity-80">{grade.comment}</span>
                         ) : (
                          <span className="opacity-40">—</span>
                        )}
                    </td>

                    <td className="opacity-70">
                      {grade.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
);
}
