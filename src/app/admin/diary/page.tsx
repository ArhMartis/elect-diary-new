import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, subjects, groups, grades, academicPeriods } from "@/db/schema/auth_schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import DiaryForm from "./DiaryForm";

const GRADE_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Н"];

export default async function AdminDiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; date?: string; periodId?: string }>;
}) {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const selectedStudentId = params.studentId;
  const selectedDate = params.date || new Date().toISOString().split("T")[0];
  const selectedPeriodId = params.periodId;

  // Получаем всех учеников
  const students = await db
    .select()
    .from(user)
    .where(eq(user.role, "student"))
    .orderBy(user.name);

  // Получаем всех учителей
  const teachers = await db
    .select()
    .from(user)
    .where(eq(user.role, "teacher"));

  // Получаем все предметы
  const subjectsList = await db.select().from(subjects);

  // Получаем все классы
  const groupsList = await db.select().from(groups);

  // Получаем все четверти
  const allPeriods = await db.select().from(academicPeriods).orderBy(academicPeriods.startDate);

  // Получаем оценки выбранного ученика
  let studentGrades: Awaited<ReturnType<typeof getStudentGrades>> = [];
  let selectedStudent: typeof user.$inferSelect | null = null;
  let periods = allPeriods; // По умолчанию все четверти

  if (selectedStudentId) {
    selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

    if (selectedStudent) {
      // Фильтруем четверти по классу ученика (общие + для этого класса)
      periods = allPeriods.filter(p => !p.groupId || p.groupId === selectedStudent?.groupId);

      // Если выбрана четверть, получаем оценки за неё
      if (selectedPeriodId) {
        const period = periods.find((p) => p.id === Number(selectedPeriodId));
        if (period) {
          studentGrades = await getStudentGrades(selectedStudentId, period.startDate, period.endDate);
        }
      } else {
        // Получаем оценки за месяц выбранной даты
        const dateObj = selectedDate ? new Date(selectedDate) : new Date();
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        const startDate = new Date(year, month, 1).toISOString().split("T")[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

        studentGrades = await getStudentGrades(selectedStudentId, startDate, endDate);
      }
    }
  }

  // Группируем оценки по датам
  const gradesByDate = studentGrades.reduce((acc, grade) => {
    const dateKey = grade.date || "";
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(grade);
    return acc;
  }, {} as Record<string, typeof studentGrades>);

  // Сортируем даты
  const sortedDates = Object.keys(gradesByDate).sort((a, b) => b.localeCompare(a));

  // Получаем класс ученика
  const studentGroup = selectedStudent?.groupId
    ? groupsList.find((g) => g.id === selectedStudent.groupId)
    : null;

  // Расчет среднего балла
  const numericGrades = studentGrades
    .map((g) => Number(g.value))
    .filter((v) => !isNaN(v));

  const average =
    numericGrades.length > 0
      ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Навигация и заголовок */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Назад к админ-панели
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Заполнение дневника</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Выставление оценок ученикам
                </p>
              </div>
            </div>

            {selectedStudent && average !== null && (
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg">
                <div className="text-xs opacity-90">Средний балл</div>
                <div className="text-2xl font-bold">{average.toFixed(2)}</div>
                <div className="text-xs opacity-75">по {numericGrades.length} оценкам</div>
              </div>
            )}
          </div>
        </div>

        <DiaryForm
          students={students}
          teachers={teachers}
          subjectsList={subjectsList}
          groupsList={groupsList}
          periods={periods}
          selectedStudent={selectedStudent}
          selectedStudentId={selectedStudentId}
          selectedDate={selectedDate}
          selectedPeriodId={selectedPeriodId}
          gradesByDate={gradesByDate}
          sortedDates={sortedDates}
          studentGrades={studentGrades}
          studentGroup={studentGroup || undefined}
        />
      </div>
    </div>
  );
}

/* =====================================================
   ПОЛУЧЕНИЕ ОЦЕНОК УЧЕНИКА ЗА ПЕРИОД
   ===================================================== */

async function getStudentGrades(studentId: string, startDate: string, endDate: string) {
  const studentGrades = await db
    .select({
      id: grades.id,
      value: grades.value,
      subjectName: subjects.name,
      date: grades.date,
      comment: grades.comment,
      teacherName: user.name,
      subjectId: grades.subjectId,
      teacherId: grades.teacherId,
    })
    .from(grades)
    .leftJoin(subjects, eq(grades.subjectId, subjects.id))
    .leftJoin(user, eq(grades.teacherId, user.id))
    .where(
      eq(grades.studentId, studentId)
    )
    .orderBy(grades.date);

  return studentGrades;
}
