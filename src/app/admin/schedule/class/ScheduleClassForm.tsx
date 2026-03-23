"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addScheduleLesson, deleteScheduleLesson } from "./actions";
import GoogleFormsDatePicker from "@/components/GoogleFormsDatePicker";

interface Group {
  id: number;
  name: string;
  teacherId: string | null;
}

interface Teacher {
  id: string;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  teacherId: string | null;
}

interface ScheduleItem {
  id: number;
  groupId: number;
  subjectId: number;
  teacherId: string;
  name: string | null;
  lessonDate: string | null;
  dayOfWeek: number | null;
  lessonNumber: number;
}

interface ScheduleClassFormProps {
  groupsList: Group[];
  teachers: Teacher[];
  subjectsList: Subject[];
  selectedGroup: Group | null;
  selectedGroupId: number | null;
  selectedDate: string | null;
  classSchedule: ScheduleItem[];
  scheduleByDate: Record<string, Record<number, Record<number, ScheduleItem>>>;
  daysOfWeek: { value: number; label: string }[];
}

const LESSON_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ScheduleClassForm({
  groupsList,
  teachers,
  subjectsList,
  selectedGroup,
  selectedGroupId,
  selectedDate,
  classSchedule,
  scheduleByDate,
  daysOfWeek,
}: ScheduleClassFormProps) {
  const router = useRouter();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const handleGroupChange = (groupId: string) => {
    const url = new URL(window.location.href);
    if (groupId) {
      url.searchParams.set("groupId", groupId);
    } else {
      url.searchParams.delete("groupId");
    }
    router.push(url.toString());
  };

  const handleDateChange = (date: string | null) => {
    const url = new URL(window.location.href);
    if (date) {
      url.searchParams.set("date", date);
    } else {
      url.searchParams.delete("date");
    }
    router.push(url.toString());
  };

  // Получаем сегоднящнюю дату для defaultValue
  const today = new Date().toISOString().split("T")[0];

  // Сортируем даты: сначала конкретные даты, потом регулярное расписание
  const sortedDates = Object.keys(scheduleByDate).sort((a, b) => {
    if (a === "regular") return 1;
    if (b === "regular") return -1;
    return a.localeCompare(b);
  });

  // Фильтруем предметы по выбранному учителю
  const filteredSubjects = selectedTeacherId
    ? subjectsList.filter((s) => s.teacherId === selectedTeacherId)
    : subjectsList;

  // Получаем учителей, у которых есть предметы
  const teachersWithSubjects = teachers.filter((t) =>
    subjectsList.some((s) => s.teacherId === t.id)
  );

  return (
    <div className="space-y-6">
      {/* Выбор класса и даты */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-violet-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Параметры расписания
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Выбор класса */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Класс
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-violet-500 bg-white"
              onChange={(e) => handleGroupChange(e.target.value)}
              value={selectedGroupId || ""}
            >
              <option value="">Выберите класс</option>
              {groupsList.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Выбор даты - Google Forms стиль */}
          <div>
            <GoogleFormsDatePicker
              value={selectedDate}
              onChange={handleDateChange}
              label="Дата урока"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-xs font-medium"
                onClick={() => handleDateChange(today)}
              >
                Сегодня
              </button>
              <button
                type="button"
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-xs font-medium"
                onClick={() => handleDateChange(null)}
                title="Регулярное расписание"
              >
                Регулярное
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedDate ? (
                <span className="text-emerald-600 font-medium">
                  ✓ Выбрана дата: {new Date(selectedDate).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              ) : (
                <span>Регулярное расписание по дням недели</span>
              )}
            </p>
          </div>
        </div>

        {selectedGroup && (
          <div className="mt-4 bg-violet-50 border border-violet-200 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-800">
              Класс: {selectedGroup.name}
              {selectedDate && ` на ${new Date(selectedDate).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}`}
            </p>
          </div>
        )}
      </div>

      {/* Форма добавления урока */}
      {selectedGroup && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Добавить урок {selectedDate && `на ${new Date(selectedDate).toLocaleDateString("ru-RU", { weekday: "long" })}`}
          </h2>

          <form action={addScheduleLesson} className="grid md:grid-cols-6 gap-4">
            <input type="hidden" name="groupId" value={selectedGroup.id} />
            <input type="hidden" name="lessonDate" value={selectedDate || ""} />

            {/* Название мероприятия */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название мероприятия
              </label>
              <input
                type="text"
                name="name"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                placeholder="Классный час, собрание..."
              />
            </div>

            {/* День недели (только для регулярного расписания) */}
            {!selectedDate ? (
              <>
                {/* День недели */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    День недели *
                  </label>
                  <select
                    name="dayOfWeek"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                    required
                  >
                    <option value="">День недели</option>
                    {daysOfWeek.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Номер урока */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    № Урока *
                  </label>
                  <select
                    name="lessonNumber"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                    required
                  >
                    <option value="">№ Урока</option>
                    {LESSON_NUMBERS.map((n) => (
                      <option key={n} value={n}>
                        {n} урок
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Номер урока для конкретной даты */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    № Урока *
                  </label>
                  <select
                    name="lessonNumber"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                    required
                  >
                    <option value="">№ Урока</option>
                    {LESSON_NUMBERS.map((n) => (
                      <option key={n} value={n}>
                        {n} урок
                      </option>
                    ))}
                  </select>
                </div>

                {/* Скрытый день недели для конкретной даты */}
                <input type="hidden" name="dayOfWeek" value="" />
              </>
            )}

            {/* Учитель */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Учитель *
              </label>
              <select
                name="teacherId"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                required
              >
                <option value="">Учитель</option>
                {teachersWithSubjects.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Предмет (фильтруется по учителю) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Предмет *
              </label>
              <select
                name="subjectId"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                required
                disabled={!selectedTeacherId}
              >
                <option value="">
                  {selectedTeacherId ? "Предмет" : "Сначала выберите учителя"}
                </option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                Добавить урок
              </button>
            </div>
          </form>

          {/* Подсказка */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-700">
                <strong>Порядок заполнения:</strong> выберите номер урока → учителя → предмет. 
                Предметы отображаются только те, которые закреплены за выбранным учителем.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Таблица расписания по датам */}
      {selectedGroup && classSchedule.length > 0 && (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const dateSchedule = scheduleByDate[dateKey];
            const isRegular = dateKey === "regular";
            const displayDate = isRegular ? null : new Date(dateKey);

            return (
              <div key={dateKey} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-amber-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {isRegular ? (
                      <span>Регулярное расписание</span>
                    ) : (
                      <span>{displayDate?.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                    )}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {Object.values(dateSchedule).flat().length} уроков
                    </span>
                    {!isRegular && (
                      <form action={deleteScheduleLesson}>
                        <input type="hidden" name="date" value={dateKey} />
                        <input type="hidden" name="groupId" value={selectedGroup.id} />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                          onClick={(e) => {
                            if (!confirm("Удалить ВСЁ расписание на эту дату?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Удалить всё
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        {!isRegular && (
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Дата</th>
                        )}
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">День</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">№</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Мероприятие</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Учитель</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Предмет</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Для конкретных дат получаем все уроки напрямую
                        if (!isRegular) {
                          // dateSchedule имеет тип Record<number, Record<number, ScheduleItem>>
                          // Сначала получаем все вложенные Record, затем все уроки
                          const allLessons: ScheduleItem[] = Object.values(dateSchedule).flatMap(
                            (dayRecord) => Object.values(dayRecord)
                          );
                          return allLessons.map((lesson) => {
                            const subject = subjectsList.find((s) => s.id === lesson.subjectId);
                            const teacher = teachers.find((t) => t.id === lesson.teacherId);
                            const lessonDate = lesson.lessonDate ? new Date(lesson.lessonDate) : null;
                            const dayName = lessonDate?.toLocaleDateString("ru-RU", { weekday: "long" }) || "—";

                            return (
                              <tr key={lesson.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-800">
                                  {displayDate?.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                                </td>
                                <td className="py-3 px-4 text-gray-800">{dayName}</td>
                                <td className="py-3 px-4 text-gray-800">
                                  <span className="inline-block px-2 py-1 bg-violet-100 text-violet-700 rounded text-sm font-medium">
                                    {lesson.lessonNumber}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-800 font-medium">
                                  {lesson.name || "—"}
                                </td>
                                <td className="py-3 px-4 text-gray-800 font-medium">
                                  {teacher?.name || "—"}
                                </td>
                                <td className="py-3 px-4 text-gray-800">
                                  {subject?.name || "—"}
                                </td>
                                <td className="py-3 px-4">
                                  <form action={deleteScheduleLesson} className="inline">
                                    <input type="hidden" name="id" value={lesson.id} />
                                    <button
                                      type="submit"
                                      className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                                      onClick={(e) => {
                                        if (!confirm("Удалить этот урок из расписания?")) {
                                          e.preventDefault();
                                        }
                                      }}
                                    >
                                      Удалить
                                    </button>
                                  </form>
                                </td>
                              </tr>
                            );
                          });
                        }

                        // Для регулярного расписания используем группировку по дням недели
                        return daysOfWeek.map((day) => {
                          const dayLessons = dateSchedule[day.value] || {};
                          const lessonNumbers = Object.keys(dayLessons).map(Number).sort((a, b) => a - b);

                          if (lessonNumbers.length === 0) return null;

                          return lessonNumbers.map((lessonNum) => {
                            const lesson = dayLessons[lessonNum];
                            const subject = subjectsList.find((s) => s.id === lesson.subjectId);
                            const teacher = teachers.find((t) => t.id === lesson.teacherId);

                            return (
                              <tr key={lesson.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 text-gray-800">{day.label}</td>
                                <td className="py-3 px-4 text-gray-800">
                                  <span className="inline-block px-2 py-1 bg-violet-100 text-violet-700 rounded text-sm font-medium">
                                    {lessonNum}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-800 font-medium">
                                  {lesson.name || "—"}
                                </td>
                                <td className="py-3 px-4 text-gray-800 font-medium">
                                  {teacher?.name || "—"}
                                </td>
                                <td className="py-3 px-4 text-gray-800">
                                  {subject?.name || "—"}
                                </td>
                                <td className="py-3 px-4">
                                  <form action={deleteScheduleLesson} className="inline">
                                    <input type="hidden" name="id" value={lesson.id} />
                                    <button
                                      type="submit"
                                      className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                                      onClick={(e) => {
                                        if (!confirm("Удалить этот урок из расписания?")) {
                                          e.preventDefault();
                                        }
                                      }}
                                    >
                                      Удалить
                                    </button>
                                  </form>
                                </td>
                              </tr>
                            );
                          });
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Если расписание пустое */}
      {selectedGroup && classSchedule.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-violet-600"
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
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Расписание не заполнено</h3>
          <p className="text-gray-500">
            Используйте форму выше, чтобы добавить уроки в расписание класса {selectedGroup.name}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Можно добавить как регулярное расписание (по дням недели), так и расписание на конкретную дату
          </p>
        </div>
      )}

      {/* Если класс не выбран */}
      {!selectedGroup && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-violet-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Заполнение расписания</h3>
          <p className="text-gray-500">
            Выберите класс из списка выше, чтобы заполнить его расписание
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Можно добавить расписание на конкретную дату или регулярное расписание по дням недели
          </p>
        </div>
      )}
    </div>
  );
}
