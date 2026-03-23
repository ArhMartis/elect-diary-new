import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, subjects, groups, schedule } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import ScheduleClassForm from "./ScheduleClassForm";

const DAYS_OF_WEEK = [
  { value: 1, label: "Понедельник" },
  { value: 2, label: "Вторник" },
  { value: 3, label: "Среда" },
  { value: 4, label: "Четверг" },
  { value: 5, label: "Пятница" },
  { value: 6, label: "Суббота" },
];

export default async function ScheduleClassPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string; date?: string }>;
}) {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const params = await searchParams;
  const selectedGroupId = params.groupId ? Number(params.groupId) : null;
  const selectedDate = params.date || null;

  // Получаем все классы
  const groupsList = await db.select().from(groups);

  // Получаем всех учителей
  const teachers = await db
    .select()
    .from(user)
    .where(eq(user.role, "teacher"));

  // Получаем все предметы с учителями
  const subjectsList = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      teacherId: subjects.teacherId,
    })
    .from(subjects);

  // Получаем расписание выбранного класса
  let classSchedule: typeof schedule.$inferSelect[] = [];
  let selectedGroup: typeof groups.$inferSelect | null = null;

  if (selectedGroupId) {
    selectedGroup = groupsList.find((g) => g.id === selectedGroupId) || null;

    if (selectedGroup) {
      classSchedule = await db
        .select()
        .from(schedule)
        .where(eq(schedule.groupId, selectedGroupId))
        .orderBy(schedule.lessonDate, schedule.dayOfWeek, schedule.lessonNumber);
    }
  }

  // Группируем расписание по датам и дням
  const scheduleByDate: Record<string, Record<number, Record<number, typeof schedule.$inferSelect>>> = {};
  classSchedule.forEach((item) => {
    const dateKey = item.lessonDate || "regular";
    if (!scheduleByDate[dateKey]) {
      scheduleByDate[dateKey] = {};
    }
    if (!scheduleByDate[dateKey][item.dayOfWeek || 0]) {
      scheduleByDate[dateKey][item.dayOfWeek || 0] = {};
    }
    scheduleByDate[dateKey][item.dayOfWeek || 0][item.lessonNumber] = item;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 p-6">
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
                <h1 className="text-3xl font-bold text-gray-800">Расписание по классам</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Заполнение расписания для каждого класса
                </p>
              </div>
            </div>
          </div>
        </div>

        <ScheduleClassForm
          groupsList={groupsList}
          teachers={teachers}
          subjectsList={subjectsList}
          selectedGroup={selectedGroup}
          selectedGroupId={selectedGroupId}
          selectedDate={selectedDate}
          classSchedule={classSchedule}
          scheduleByDate={scheduleByDate}
          daysOfWeek={DAYS_OF_WEEK}
        />
      </div>
    </div>
  );
}
