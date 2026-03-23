"use client";

import { useRouter } from "next/navigation";
import { addGrade, updateGrade, deleteGrade } from "./actions";
import { useState, useEffect } from "react";

interface Student {
  id: string;
  name: string;
  email: string;
  groupId: number | null;
}

interface Teacher {
  id: string;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
}

interface AcademicPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

interface Grade {
  id: number;
  value: string;
  subjectName: string | null;
  date: string | null;
  comment: string | null;
  teacherName: string | null;
  subjectId?: number;
  teacherId?: string;
  academicPeriodId?: number | null;
}

interface DiaryFormProps {
  students: Student[];
  teachers: Teacher[];
  subjectsList: Subject[];
  groupsList: Group[];
  periods: AcademicPeriod[];
  selectedStudent: Student | null;
  selectedStudentId: string | undefined;
  selectedDate: string;
  selectedPeriodId: string | undefined;
  gradesByDate: Record<string, Grade[]>;
  sortedDates: string[];
  studentGrades: Grade[];
  studentGroup: Group | undefined;
}

const GRADE_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Н"];

export default function DiaryForm({
  students,
  teachers,
  subjectsList,
  groupsList,
  periods,
  selectedStudent,
  selectedStudentId,
  selectedDate,
  selectedPeriodId,
  gradesByDate,
  sortedDates,
  studentGrades,
  studentGroup,
}: DiaryFormProps) {
  const router = useRouter();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [existingGrade, setExistingGrade] = useState<Grade | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");

  // Проверяем, есть ли уже оценка на выбранный предмет и дату
  useEffect(() => {
    if (selectedStudentId && selectedDate && selectedSubjectId) {
      const grade = studentGrades.find(
        (g) => g.subjectId === selectedSubjectId && g.date === selectedDate
      );
      setExistingGrade(grade || null);
      setComment(grade?.comment || "");
      setSelectedGrade(grade?.value || "");
      // Сбрасываем форму при изменении предмета/даты
      setFormKey(prev => prev + 1);
    } else {
      setExistingGrade(null);
      setComment("");
      setSelectedGrade("");
    }
  }, [selectedStudentId, selectedDate, selectedSubjectId, studentGrades]);

  const handleStudentChange = (studentId: string) => {
    const url = new URL(window.location.href);
    if (studentId) {
      url.searchParams.set("studentId", studentId);
    } else {
      url.searchParams.delete("studentId");
    }
    router.push(url.toString());
  };

  const handleDateChange = (date: string) => {
    const url = new URL(window.location.href);
    if (date) {
      url.searchParams.set("date", date);
    } else {
      url.searchParams.delete("date");
    }
    router.push(url.toString());
  };

  const handlePeriodChange = (periodId: string) => {
    const url = new URL(window.location.href);
    if (periodId) {
      url.searchParams.set("periodId", periodId);
      url.searchParams.delete("date");
    } else {
      url.searchParams.delete("periodId");
    }
    router.push(url.toString());
  };

  const handleSubjectChange = (subjectId: string) => {
    const id = subjectId ? Number(subjectId) : null;
    setSelectedSubjectId(id);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* ЛЕВАЯ КОЛОНКА - Форма добавления оценки */}
      <div className="lg:col-span-1 space-y-6">
        {/* Выбор ученика */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-emerald-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-4 0 3 3 0 014 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Выбор ученика и четверти
          </h2>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ученик
                </label>
                <select
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-emerald-500 bg-white"
                  onChange={(e) => handleStudentChange(e.target.value)}
                  value={selectedStudentId || ""}
                >
                  <option value="">Выберите ученика</option>
                  {students.map((student) => {
                    const studentGroup = student.groupId ? groupsList.find(g => g.id === student.groupId) : null;
                    return (
                      <option key={student.id} value={student.id}>
                        {student.name} {studentGroup && `(${studentGroup.name})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Четверть
                </label>
                <select
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-emerald-500 bg-white"
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  value={selectedPeriodId || ""}
                >
                  <option value="">Все оценки</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({new Date(period.startDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })} - {new Date(period.endDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStudent && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-800">{selectedStudent.name}</p>
                <p className="text-xs text-gray-500">{selectedStudent.email}</p>
                {studentGroup && (
                  <p className="text-xs text-emerald-600 mt-1">Класс: {studentGroup.name}</p>
                )}
                {selectedPeriodId && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Четверть: {periods.find(p => p.id === Number(selectedPeriodId))?.name}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Форма добавления/редактирования оценки */}
        {selectedStudent && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ${existingGrade ? "text-amber-600" : "text-blue-600"}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {existingGrade ? (
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              {existingGrade ? "Редактировать оценку" : "Добавить оценку"}
            </h2>

            {existingGrade && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">
                    Оценка уже выставлена: <strong>{existingGrade.value}</strong> по предмету "{existingGrade.subjectName}"
                  </span>
                </div>
              </div>
            )}

            <form action={existingGrade ? updateGrade : addGrade} className="space-y-4" key={formKey}>
              <input type="hidden" name="studentId" value={selectedStudent.id} />
              <input type="hidden" name="comment" value={comment} />
              <input type="hidden" name="value" value={selectedGrade} />
              {existingGrade && <input type="hidden" name="gradeId" value={existingGrade.id.toString()} />}

              {/* Дата */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата *
                </label>
                <input
                  type="date"
                  name="date"
                  value={selectedDate}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </div>

              {/* Предмет */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Предмет *
                </label>
                <select
                  name="subjectId"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                  value={selectedSubjectId?.toString() || ""}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required
                >
                  <option value="">Выберите предмет</option>
                  {subjectsList.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Учитель */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Учитель *
                </label>
                <select
                  name="teacherId"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                  value={existingGrade?.teacherId || ""}
                  required
                >
                  <option value="">Выберите учителя</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Оценка */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Оценка *
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {GRADE_OPTIONS.map((grade) => (
                    <label key={grade} className="relative">
                      <input
                        type="radio"
                        name="value"
                        value={grade}
                        className="peer sr-only"
                        checked={selectedGrade === grade}
                        onChange={() => setSelectedGrade(grade)}
                        required
                      />
                      <div className="text-center py-2 px-3 bg-gray-100 rounded-lg cursor-pointer peer-checked:bg-blue-600 peer-checked:text-white transition-all hover:bg-gray-200 font-medium">
                        {grade}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Комментарий */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий
                </label>
                <textarea
                  name="comment"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Домашнее задание или комментарий..."
                />
              </div>

              <button
                type="submit"
                className={`w-full px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg font-medium ${
                  existingGrade
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                }`}
              >
                {existingGrade ? "Сохранить изменения" : "Добавить оценку"}
              </button>
            </form>

            {existingGrade && (
              <form action={deleteGrade} className="mt-3">
                <input type="hidden" name="id" value={existingGrade.id.toString()} />
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all font-medium"
                  onClick={(e) => {
                    if (!confirm("Удалить эту оценку?")) {
                      e.preventDefault();
                    }
                  }}
                >
                  Удалить оценку
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ПРАВАЯ КОЛОНКА - Оценки */}
      <div className="lg:col-span-2">
        {selectedStudent ? (
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
                Оценки ученика
              </h2>
              <div className="text-sm text-gray-500">
                {sortedDates.length > 0 ? (
                  <span>Всего оценок: {studentGrades.length}</span>
                ) : (
                  <span>Оценок пока нет</span>
                )}
              </div>
            </div>

            {sortedDates.length > 0 ? (
              <div className="space-y-6">
                {sortedDates.map((date) => {
                  const dateObj = new Date(date + "T12:00:00");
                  const dayOfWeek = dateObj.toLocaleDateString("ru-RU", { weekday: "long" });
                  const formattedDate = dateObj.toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <div key={date} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800 capitalize">{dayOfWeek}</p>
                            <p className="text-sm text-gray-500">{formattedDate}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDateChange(date)}
                              className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
                                selectedDate === date
                                  ? "bg-blue-600 text-white"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              }`}
                            >
                              {selectedDate === date ? "Выбрано" : "Выбрать дату"}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {gradesByDate[date].map((grade, idx) => (
                          <div
                            key={grade.id}
                            className={`px-4 py-3 flex items-center justify-between ${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                                  grade.value === "10"
                                    ? "bg-green-500"
                                    : grade.value === "Н"
                                    ? "bg-gray-400"
                                    : Number(grade.value) >= 7
                                    ? "bg-blue-500"
                                    : Number(grade.value) >= 4
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                              >
                                {grade.value}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {grade.subjectName || "—"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {grade.teacherName || "—"}
                                </p>
                                {grade.comment && (
                                  <p className="text-xs text-gray-400 mt-1 max-w-md truncate">
                                    {grade.comment}
                                  </p>
                                )}
                              </div>
                            </div>
                            <form action={deleteGrade}>
                              <input type="hidden" name="id" value={grade.id} />
                              <button
                                type="submit"
                                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                                onClick={(e) => {
                                  if (!confirm("Удалить эту оценку?")) {
                                    e.preventDefault();
                                  }
                                }}
                              >
                                Удалить
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-400"
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
                <p className="text-gray-500">У этого ученика пока нет оценок</p>
                <p className="text-sm text-gray-400 mt-2">
                  Используйте форму слева, чтобы добавить первую оценку
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-emerald-600"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4-.001z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Заполнение дневника</h2>
            <p className="text-gray-500">
              Выберите ученика из списка слева, чтобы начать заполнение дневника
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Вы сможете добавлять оценки по предметам с указанием даты и комментария
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
