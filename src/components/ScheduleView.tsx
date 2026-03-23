import type { InferSelectModel } from "drizzle-orm";

interface ScheduleViewProps {
  scheduleList: {
    id: number;
    groupId: number;
    subjectId: number;
    teacherId: string;
    name: string | null;
    dayOfWeek: number | null;
    lessonDate: string | null;
    lessonNumber: number;
    subjectName?: string | null;
    teacherName?: string | null;
    groupName?: string | null;
  }[];
  groupId?: number | null;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Понедельник" },
  { value: 2, label: "Вторник" },
  { value: 3, label: "Среда" },
  { value: 4, label: "Четверг" },
  { value: 5, label: "Пятница" },
  { value: 6, label: "Суббота" },
];

export default function ScheduleView({ scheduleList, groupId }: ScheduleViewProps) {
  // Фильтруем расписание по классу, если указан groupId
  const filteredSchedule = groupId
    ? scheduleList.filter((s) => s.groupId === groupId)
    : scheduleList;

  // Разделяем на регулярное расписание и расписание по датам
  const regularSchedule = filteredSchedule.filter((s) => s.dayOfWeek !== null && s.dayOfWeek !== undefined);
  const dateSchedule = filteredSchedule.filter((s) => s.lessonDate !== null && s.lessonDate !== undefined && s.lessonDate !== "");

  // Сортируем регулярное расписание по дню недели и номеру урока
  const sortedRegularSchedule = [...regularSchedule].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return (a.dayOfWeek || 0) - (b.dayOfWeek || 0);
    return a.lessonNumber - b.lessonNumber;
  });

  // Группируем регулярное расписание по дням недели
  const scheduleByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    lessons: sortedRegularSchedule.filter((s) => s.dayOfWeek === day.value),
  }));

  // Группируем расписание по датам
  const scheduleByDate: Record<string, typeof filteredSchedule> = {};
  dateSchedule.forEach((item) => {
    const dateKey = item.lessonDate || "";
    if (!scheduleByDate[dateKey]) {
      scheduleByDate[dateKey] = [];
    }
    scheduleByDate[dateKey].push(item);
  });

  // Сортируем даты
  const sortedDates = Object.keys(scheduleByDate).sort((a, b) => a.localeCompare(b));

  if (sortedRegularSchedule.length === 0 && sortedDates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-gray-500">Расписание пока не заполнено</p>
      </div>
    );
  }

  const renderLesson = (lesson: typeof scheduleList[number]) => (
    <div
      key={lesson.id}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          {lesson.lessonNumber} урок
        </span>
        {lesson.lessonDate && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            {new Date(lesson.lessonDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
          </span>
        )}
      </div>
      {lesson.name && (
        <div className="text-sm font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded mb-1">
          {lesson.name}
        </div>
      )}
      <div className="font-medium text-gray-800">
        {lesson.subjectName || "—"}
      </div>
      {lesson.teacherName && (
        <div className="text-xs text-gray-500 mt-1">
          {lesson.teacherName}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Расписание на конкретные даты */}
      {sortedDates.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-emerald-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            Расписание на даты
          </h2>
          <div className="space-y-4">
            {sortedDates.map((date) => {
              const dateObj = new Date(date);
              const dayName = dateObj.toLocaleDateString("ru-RU", { weekday: "long" });
              const fullDate = dateObj.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

              return (
                <div key={date} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                  <h3 className="font-bold text-gray-800 mb-3">
                    <span className="text-emerald-700">{dayName.charAt(0).toUpperCase() + dayName.slice(1)}</span>
                    <span className="text-gray-500 font-normal ml-2">({fullDate})</span>
                  </h3>
                  <div className="space-y-2">
                    {scheduleByDate[date]
                      .sort((a, b) => a.lessonNumber - b.lessonNumber)
                      .map(renderLesson)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Регулярное расписание */}
      {sortedRegularSchedule.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            Регулярное расписание
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduleByDay
              .filter((day) => day.lessons.length > 0)
              .map((day) => (
                <div
                  key={day.value}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100"
                >
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                      {day.value}
                    </span>
                    {day.label}
                  </h3>
                  <div className="space-y-2">
                    {day.lessons
                      .sort((a, b) => a.lessonNumber - b.lessonNumber)
                      .map(renderLesson)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
