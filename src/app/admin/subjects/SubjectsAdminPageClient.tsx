"use client";

import { useState } from "react";
import Link from "next/link";
import { SubjectItem } from "./SubjectItem";

interface ClassGroup {
  id: number;
  name: string;
  teacherId: string | null;
}

interface Subject {
  id: number;
  name: string;
  teacherId: string | null;
  type?: string | null;
}

export default function SubjectsAdminPage({
  allSubjectsData,
  teachersData,
  classesData,
  teacherSubjectsData,
}: {
  allSubjectsData: Subject[];
  teachersData: any[];
  classesData: ClassGroup[];
  teacherSubjectsData: any[];
}) {
  const classNumbers = Array.from(new Set(
    classesData.map(cls => {
      const match = cls.name.match(/^(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }).filter(n => n > 0)
  )).sort((a, b) => a - b);

  const [selectedClassNumber, setSelectedClassNumber] = useState<number | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [eventForm, setEventForm] = useState({ name: "", type: "class_hour" });
  const [specialForm, setSpecialForm] = useState({ name: "", type: "elective" });

  const selectedClassGroups = selectedClassNumber
    ? classesData.filter(cls => cls.name.startsWith(`${selectedClassNumber}-`) || cls.name.startsWith(`${selectedClassNumber} `))
    : [];

  const regularSubjects = allSubjectsData.filter(s => !s.type || s.type === "regular");
  const classHourSubjects = allSubjectsData.filter(s => s.type === "class_hour");
  const eventSubjects = allSubjectsData.filter(s => s.type === "event");
  const olympiadSubjects = allSubjectsData.filter(s => s.type === "olympiad");
  const electiveSubjects = allSubjectsData.filter(s => s.type === "elective");

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSave = async () => {
    for (const groupId of selectedGroupIds) {
      await fetch("/api/group-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, subjectIds: selectedSubjects }),
      });
    }
    setSelectedClassNumber(null);
    setSelectedSubjects([]);
    setSelectedGroupIds([]);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Добавить мероприятие:", eventForm);
    setEventForm({ name: "", type: "class_hour" });
  };

  const handleAddSpecial = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/subjects/create", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `name=${encodeURIComponent(specialForm.name)}&type=${specialForm.type}`,
    }).then(() => {
      setSpecialForm({ name: "", type: "elective" });
      window.location.reload();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow"
        >
          ← Назад
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">Управление предметами</h1>
      </div>

      {/* Форма добавления предмета */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="text-xl">📚</span>
          Добавить предмет
        </h2>
        <form action="/api/subjects/create" className="flex gap-3">
          <input
            name="name"
            placeholder="Название предмета"
            className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            required
          />
          <input type="hidden" name="type" value="regular" />
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md font-medium"
          >
            Добавить
          </button>
        </form>
      </div>

      {/* Форма добавления мероприятия */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg p-6 border-2 border-emerald-200">
        <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Добавить мероприятие или классный час
        </h2>
        <form onSubmit={handleAddEvent} className="flex gap-3">
          <input
            type="text"
            value={eventForm.name}
            onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
            placeholder="Название мероприятия"
            className="flex-1 border-2 border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500 bg-white"
            required
          />
          <select
            value={eventForm.type}
            onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
            className="border-2 border-emerald-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-emerald-500 bg-white"
          >
            <option value="class_hour">Классный час</option>
            <option value="event">Мероприятие</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-md font-medium"
          >
            Добавить
          </button>
        </form>
      </div>

      {/* Форма добавления специализированных предметов */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <span className="text-xl">🏆</span>
          Добавить специализированные предметы (факультативы, олимпиады)
        </h2>
        <form onSubmit={handleAddSpecial} className="flex gap-3">
          <input
            type="text"
            value={specialForm.name}
            onChange={(e) => setSpecialForm({ ...specialForm, name: e.target.value })}
            placeholder="Название спецпредмета"
            className="flex-1 border-2 border-blue-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 bg-white"
            required
          />
          <select
            value={specialForm.type}
            onChange={(e) => setSpecialForm({ ...specialForm, type: e.target.value })}
            className="border-2 border-blue-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="elective">Факультатив</option>
            <option value="olympiad">Олимпиада</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-medium"
          >
            Добавить
          </button>
        </form>
      </div>

      {/* Фильтр по классам */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span>🏫</span>
          Предметы по классам
        </h2>

        {classNumbers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Классы ещё не созданы</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {classNumbers.map((num) => {
              const classGroups = classesData.filter(cls =>
                cls.name.startsWith(`${num}-`) || cls.name.startsWith(`${num} `)
              );
              return (
                <button
                  key={num}
                  onClick={async () => {
                    setSelectedClassNumber(num);
                    const groups = classesData.filter(cls =>
                      cls.name.startsWith(`${num}-`) || cls.name.startsWith(`${num} `)
                    );
                    setSelectedGroupIds(groups.map(g => g.id));
                    setIsLoadingSubjects(true);
                    try {
                      const allSelected = new Set<number>();
                      for (const g of groups) {
                        const res = await fetch(`/api/group-subjects?groupId=${g.id}`);
                        const data = await res.json();
                        data.forEach((row: any) => allSelected.add(row.subjectId));
                      }
                      setSelectedSubjects([...allSelected]);
                    } catch {
                      setSelectedSubjects([]);
                    }
                    setIsLoadingSubjects(false);
                  }}
                  className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer text-left"
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-700 mb-2">{num}</div>
                    <div className="text-xs text-gray-600">
                      {classGroups.length} кл.
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {classGroups.map(g => g.name).join(", ")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Примечание:</strong> Нажмите на номер класса, чтобы выбрать предметы для расписания.
          </p>
        </div>
      </div>

      {/* Список предметов */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Обычные предметы</h2>
        {regularSubjects.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Предметы ещё не добавлены</p>
        ) : (
          <div className="space-y-3">
            {regularSubjects.map((subject) => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                teachers={teachersData}
                teacherSubjects={teacherSubjectsData}
              />
            ))}
          </div>
        )}
      </div>

      {/* Мероприятия и классные часы */}
      {(classHourSubjects.length > 0 || eventSubjects.length > 0) && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg p-6 border-2 border-emerald-200">
          <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Мероприятия и классные часы
          </h2>
          <div className="space-y-3">
            {classHourSubjects.map((subject) => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                teachers={teachersData}
                teacherSubjects={teacherSubjectsData}
              />
            ))}
            {eventSubjects.map((subject) => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                teachers={teachersData}
                teacherSubjects={teacherSubjectsData}
              />
            ))}
          </div>
        </div>
      )}

      {/* Специализированные предметы */}
      {(olympiadSubjects.length > 0 || electiveSubjects.length > 0) && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border-2 border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Специализированные предметы
          </h2>
          <div className="space-y-3">
            {olympiadSubjects.map((subject) => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                teachers={teachersData}
                teacherSubjects={teacherSubjectsData}
              />
            ))}
            {electiveSubjects.map((subject) => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                teachers={teachersData}
                teacherSubjects={teacherSubjectsData}
              />
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно выбора предметов */}
      {selectedClassNumber !== null && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Выбор предметов для {selectedClassNumber} класса
                </h2>
                <button
                  onClick={() => {
                    setSelectedClassNumber(null);
                    setSelectedSubjects([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Классы: {selectedClassGroups.map(g => g.name).join(", ")}
              </p>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Обычные предметы</h3>
              <div className="grid gap-3 mb-6">
                {regularSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="font-medium text-gray-800 flex-1">{subject.name}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-blue-600 mb-3">Факультативы</h3>
              <div className="grid gap-3">
                {electiveSubjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center gap-3 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-800 flex-1">{subject.name}</span>
                    <span className="badge badge-sm bg-blue-100 text-blue-700">факультатив</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all"
                >
                  Сохранить ({selectedSubjects.length})
                </button>
                <button
                  onClick={() => {
                    setSelectedClassNumber(null);
                    setSelectedSubjects([]);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
