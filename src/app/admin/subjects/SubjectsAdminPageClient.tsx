"use client";

import { useState, useEffect } from "react";
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

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
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
  const [regularForm, setRegularForm] = useState({ name: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const selectedClassGroups = selectedClassNumber
    ? classesData.filter(cls => cls.name.startsWith(`${selectedClassNumber}-`) || cls.name.startsWith(`${selectedClassNumber} `))
    : [];

  const regularSubjects = allSubjectsData.filter(s => !s.type || s.type === "regular").sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const classHourSubjects = allSubjectsData.filter(s => s.type === "class_hour").sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const eventSubjects = allSubjectsData.filter(s => s.type === "event").sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const olympiadSubjects = allSubjectsData.filter(s => s.type === "olympiad").sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const electiveSubjects = allSubjectsData.filter(s => s.type === "elective").sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSave = async () => {
    // Всегда включаем классные часы
    const classHourIds = classHourSubjects.map(s => s.id);
    const finalSubjectIds = Array.from(new Set([...selectedSubjects, ...classHourIds]));

    for (const groupId of selectedGroupIds) {
      await fetch("/api/group-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, subjectIds: finalSubjectIds }),
      });
    }
    setSelectedClassNumber(null);
    setSelectedSubjects([]);
    setSelectedGroupIds([]);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append("name", eventForm.name);
      formData.append("type", eventForm.type);

      const response = await fetch("/api/subjects/create", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setEventForm({ name: "", type: "class_hour" });
        showToast(eventForm.type === 'class_hour' ? 'Классный час успешно добавлен!' : 'Мероприятие успешно добавлено!');
        setTimeout(() => window.location.reload(), 500);
      } else {
        const error = await response.json();
        showToast(error.error || "Ошибка при создании", 'error');
      }
    } catch (err) {
      showToast("Ошибка при создании", 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddSpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append("name", specialForm.name);
      formData.append("type", specialForm.type);

      const response = await fetch("/api/subjects/create", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSpecialForm({ name: "", type: "elective" });
        showToast(specialForm.type === 'elective' ? 'Специализированный предмет успешно добавлен!' : 'Олимпиада успешно добавлена!');
        setTimeout(() => window.location.reload(), 500);
      } else {
        const error = await response.json();
        showToast(error.error || "Ошибка при создании предмета", 'error');
      }
    } catch (err) {
      showToast("Ошибка при создании предмета", 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddRegular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regularForm.name.trim()) return;

    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append("name", regularForm.name);
      formData.append("type", "regular");

      const response = await fetch("/api/subjects/create", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setRegularForm({ name: "" });
        showToast('Предмет успешно добавлен!');
        setTimeout(() => window.location.reload(), 500);
      } else {
        const error = await response.json();
        showToast(error.error || "Ошибка при создании предмета", 'error');
      }
    } catch (err) {
      showToast("Ошибка при создании предмета", 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад в админ-панель
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">📚 Управление предметами</h1>
        </div>

      {/* Форма добавления предмета */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="text-xl">📚</span>
          Добавить предмет
        </h2>
        <form onSubmit={handleAddRegular} className="flex gap-3">
          <input
            value={regularForm.name}
            onChange={(e) => setRegularForm({ name: e.target.value })}
            placeholder="Название предмета"
            className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            required
          />
          <button
            type="submit"
            disabled={isAdding}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md font-medium disabled:opacity-50"
          >
            {isAdding ? "Добавление..." : "Добавить"}
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
          Добавить специализированные предметы (факультативы, олимпиады, и тому подобные)
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
            <option value="elective">Специализированные предметы</option>
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
                onShowToast={showToast}
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
                onShowToast={showToast}
              />
            ))}
            {eventSubjects.map((subject) => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                teachers={teachersData}
                teacherSubjects={teacherSubjectsData}
                onShowToast={showToast}
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
                onShowToast={showToast}
              />
            ))}
            {electiveSubjects.map((subject) => (
              <SubjectItem
                key={subject.id}
                subject={subject}
                teachers={teachersData}
                teacherSubjects={teacherSubjectsData}
                onShowToast={showToast}
              />
            ))}
          </div>
        </div>
      )}

      {/* Модальное окно выбора предметов */}
      {selectedClassNumber !== null && (
        <div 
          className="fixed inset-0 backdrop-blur-md bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedClassNumber(null);
              setSelectedSubjects([]);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
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

              {/* Классный час — автоматически выбран и заблокирован */}
              {classHourSubjects.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-emerald-600 mb-3">Классный час</h3>
                  <div className="grid gap-3 mb-6">
                    {classHourSubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center gap-3 p-4 border-2 border-emerald-200 rounded-lg bg-emerald-50/50"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-not-allowed opacity-60"
                        />
                        <span className="font-medium text-gray-800 flex-1">{subject.name}</span>
                        <span className="badge badge-sm bg-emerald-100 text-emerald-700">обязательно</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h3 className="text-sm font-semibold text-blue-600 mb-3">Специализированные предметы</h3>
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
                    <span className="badge badge-sm bg-blue-100 text-blue-700">спецпредмет</span>
                  </div>
                ))}
                {olympiadSubjects.map((subject) => (
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
                    <span className="badge badge-sm bg-blue-100 text-blue-700">олимпиада</span>
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

      {/* Toast уведомления - справа и ниже Navbar */}
      <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-80">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={`px-5 py-4 rounded-xl shadow-2xl font-bold text-white transform transition-all duration-500 ease-out backdrop-blur-md bg-opacity-95 border-l-4 ${
              toast.type === 'success'
                ? 'bg-emerald-500 border-emerald-300'
                : 'bg-red-500 border-red-300'
            }`}
            style={{
              animation: `slideInRight 0.4s ease-out ${index * 100}ms forwards, fadeOut 0.4s ease-in ${2600 + index * 100}ms forwards`
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">{toast.type === 'success' ? '✅' : '❌'}</span>
              <span className="text-base leading-tight">{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
      
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(20px) scale(0.95);
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.4s ease-out forwards;
        }
      `}</style>
      </div>
    </div>
  );
}
