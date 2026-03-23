"use client";

import { useRouter } from "next/navigation";
import { addGradesToClass, deleteGrade } from "./actions";
import { useState, useEffect } from "react";

interface Group {
  id: number;
  name: string;
  teacherId: string | null;
}

interface Subject {
  id: number;
  name: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface ExistingGrade {
  id: number;
  value: string;
  comment: string | null;
}

interface GradesFormProps {
  groups: Group[];
  subjects: Subject[];
  students: Student[];
  selectedGroup: Group | null;
  selectedGroupId: number | null;
  selectedSubjectId: number | null;
  selectedDate: string;
  existingGrades: Record<string, ExistingGrade>;
  teacherId: string;
  gradeOptions: string[];
  classSchedule?: {
    id: number;
    groupId: number;
    subjectId: number;
    teacherId: string;
    lessonDate: string | null;
    dayOfWeek: number | null;
    lessonNumber: number;
  }[];
}

export default function GradesForm({
  groups,
  subjects,
  students,
  selectedGroup,
  selectedGroupId,
  selectedSubjectId,
  selectedDate,
  existingGrades,
  teacherId,
  gradeOptions,
  classSchedule = [],
}: GradesFormProps) {
  const router = useRouter();
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  // Инициализируем состояния при загрузке существующих оценок
  useEffect(() => {
    const initialGrades: Record<string, string> = {};
    const initialComments: Record<string, string> = {};
    
    Object.entries(existingGrades).forEach(([studentId, grade]) => {
      initialGrades[studentId] = grade.value;
      initialComments[studentId] = grade.comment || "";
    });
    
    setGrades(initialGrades);
    setComments(initialComments);
  }, [existingGrades]);

  const handleGroupChange = (groupId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("groupId", groupId);
    router.push(url.toString());
  };

  const handleSubjectChange = (subjectId: string) => {
    const url = new URL(window.location.href);
    if (subjectId) {
      url.searchParams.set("subjectId", subjectId);
    } else {
      url.searchParams.delete("subjectId");
    }
    router.push(url.toString());
  };

  const handleDateChange = (date: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("date", date);
    router.push(url.toString());
  };

  const today = new Date().toISOString().split("T")[0];

  // Получаем предметы из расписания на выбранную дату
  const scheduleSubjects = classSchedule.map((item) => {
    const subject = subjects.find((s) => s.id === item.subjectId);
    return {
      ...item,
      subjectName: subject?.name || "—",
      date: selectedDate,
      dayName: new Date(selectedDate).toLocaleDateString("ru-RU", { weekday: "long" }),
    };
  });

  const dateObj = selectedDate ? new Date(selectedDate) : new Date();
  const dayName = dateObj.toLocaleDateString("ru-RU", { weekday: "long" });
  const fullDate = dateObj.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  // Определяем, в какие дни недели встречается выбранный предмет
  const getSubjectDays = () => {
    if (!selectedSubjectId || !classSchedule || classSchedule.length === 0) return [];
    
    const days = classSchedule
      .filter((item) => item.subjectId === selectedSubjectId)
      .map((item) => {
        if (item.lessonDate) {
          const date = new Date(item.lessonDate);
          return {
            date: item.lessonDate,
            dayName: date.toLocaleDateString("ru-RU", { weekday: "long" }),
            dayNum: date.getDay() || 7,
            fullDate: date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
          };
        } else if (item.dayOfWeek) {
          const dayNames = ["", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
          return {
            date: null,
            dayName: dayNames[item.dayOfWeek] || "—",
            dayNum: item.dayOfWeek,
            fullDate: "Регулярно",
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ date: string | null; dayName: string; dayNum: number; fullDate: string }>;
    
    // Убираем дубликаты по дням недели
    const uniqueDays = days.filter((day, index, self) =>
      index === self.findIndex((d) => d.dayNum === day.dayNum)
    );
    
    return uniqueDays.sort((a, b) => a.dayNum - b.dayNum);
  };

  const subjectDays = getSubjectDays();

  return (
    <div className="space-y-6">
      {/* Выбор параметров */}
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
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Параметры
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {/* Класс */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Класс *
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
              onChange={(e) => handleGroupChange(e.target.value)}
              value={selectedGroupId || ""}
            >
              <option value="">Выберите класс</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Предмет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Предмет *
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
              onChange={(e) => handleSubjectChange(e.target.value)}
              value={selectedSubjectId || ""}
            >
              <option value="">Выберите предмет</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата *
            </label>
            <input
              type="date"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              defaultValue={selectedDate || today}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          {/* Информация */}
          <div className="flex items-end">
            {selectedGroup && selectedSubjectId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full">
                <p className="text-sm font-medium text-blue-800">
                  {selectedGroup.name} • {subjects.find((s) => s.id === selectedSubjectId)?.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }) : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Расписание на дату */}
      {selectedGroup && classSchedule.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-emerald-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            Расписание на {dayName}, {fullDate}
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
            {classSchedule
              .sort((a, b) => a.lessonNumber - b.lessonNumber)
              .map((item) => {
                const subject = subjects.find((s) => s.id === item.subjectId);
                const isSelected = selectedSubjectId === item.subjectId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSubjectChange(item.subjectId.toString())}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isSelected ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-600"
                      }`}>
                        {item.lessonNumber} урок
                      </span>
                    </div>
                    <div className={`font-medium text-sm ${isSelected ? "text-blue-800" : "text-gray-800"}`}>
                      {subject?.name || "—"}
                    </div>
                    {isSelected && (
                      <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Выбрано
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Форма выставления оценок */}
      {selectedGroup && selectedSubjectId && students.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-amber-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              {Object.keys(existingGrades).length > 0 ? "Редактировать оценки" : "Добавить оценки"}
            </h2>
            {subjectDays.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500">Предмет встречается:</span>
                {subjectDays.map((day, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {day.dayName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {Object.keys(existingGrades).length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  На {new Date(selectedDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} уже выставлено оценок: <strong>{Object.keys(existingGrades).length}</strong>
                </span>
              </div>
            </div>
          )}

          <form action={addGradesToClass}>
            <input type="hidden" name="subjectId" value={selectedSubjectId} />
            <input type="hidden" name="teacherId" value={teacherId} />
            <input type="hidden" name="date" value={selectedDate} />

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">№</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Ученик</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Оценка</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Комментарий</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Текущие оценки</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => {
                    const existingGrade = existingGrades[student.id];
                    const studentGrade = grades[student.id] || "";
                    const studentComment = comments[student.id] || "";
                    
                    return (
                      <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800">{idx + 1}</td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{student.name}</td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center gap-1 flex-wrap">
                            {gradeOptions.map((grade) => {
                              const isSelected = studentGrade === grade;
                              const baseColor = getGradeColor(grade);
                              return (
                                <label key={grade} className="relative">
                                  <input
                                    type="radio"
                                    name={`grade_${student.id}`}
                                    value={grade}
                                    className="peer sr-only"
                                    checked={isSelected}
                                    onChange={() => setGrades(prev => ({ ...prev, [student.id]: grade }))}
                                  />
                                  <div className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-all font-bold text-sm ${
                                    isSelected
                                      ? baseColor + " text-white shadow-md"
                                      : baseColor + " text-white opacity-30 hover:opacity-60"
                                  } peer-checked:scale-110 peer-checked:opacity-100`}>
                                    {grade}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            name={`comment_${student.id}`}
                            value={studentComment}
                            onChange={(e) => setComments(prev => ({ ...prev, [student.id]: e.target.value }))}
                            placeholder="Д/З или комментарий"
                            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          {existingGrade ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className={`w-8 h-8 rounded-lg ${getGradeColor(existingGrade.value)} text-white font-bold flex items-center justify-center`}>
                                {existingGrade.value}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className={`px-8 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-medium ${
                  Object.keys(existingGrades).length > 0
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                }`}
              >
                {Object.keys(existingGrades).length > 0 ? "Сохранить изменения" : "Добавить оценки"}
              </button>
            </div>
          </form>

          {/* Отдельная секция для удаления оценок */}
          {Object.keys(existingGrades).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">Удаление выставленных оценок</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {students
                  .filter((s) => existingGrades[s.id])
                  .map((student) => {
                    const existingGrade = existingGrades[student.id];
                    return (
                      <form key={student.id} action={deleteGrade} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg ${getGradeColor(existingGrade.value)} text-white font-bold flex items-center justify-center`}>
                            {existingGrade.value}
                          </span>
                          <span className="text-sm text-gray-700">{student.name}</span>
                        </div>
                        <input type="hidden" name="id" value={existingGrade.id} />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-all text-xs font-medium"
                          onClick={(e) => {
                            if (!confirm("Удалить эту оценку?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Удалить
                        </button>
                      </form>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Если ничего не выбрано */}
      {(!selectedGroup || !selectedSubjectId) && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Выставление оценок</h3>
          <p className="text-gray-500">
            Выберите класс, предмет и дату для выставления оценок ученикам
          </p>
        </div>
      )}
    </div>
  );
}

function getGradeColor(value: string): string {
  const numeric = Number(value);
  if (isNaN(numeric)) return "bg-gray-500";
  if (numeric === 10) return "bg-green-500";
  if (numeric >= 7) return "bg-blue-500";
  if (numeric >= 4) return "bg-yellow-500";
  return "bg-red-500";
}
