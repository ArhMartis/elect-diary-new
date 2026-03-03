"use client";

import { useState, useEffect, useCallback } from "react";
import { saveDiaryNote, getDiaryNote, verifyDiaryWeek, getDiaryVerification, verifyDiaryByParent, getParentVerification, isTeacherHomeroomTeacher, isUserParentOfStudent } from "@/app/student/actions";

interface Grade {
  id: number;
  value: string;
  comment?: string | null;
  date: string | null;
  subjectName: string | null;
  teacherName?: string | null;
}

interface StudentDiaryProps {
  grades: Grade[];
  studentId: string;
  currentUserId?: string;
  isTeacher?: boolean;
  isParent?: boolean;
  isHomeroomTeacher?: boolean;
}

const DAYS_OF_WEEK = [
  { name: "Понедельник", dayOfWeek: 1 },
  { name: "Вторник", dayOfWeek: 2 },
  { name: "Среда", dayOfWeek: 3 },
  { name: "Четверг", dayOfWeek: 4 },
  { name: "Пятница", dayOfWeek: 5 },
  { name: "Суббота", dayOfWeek: 6 },
];

const SUBJECTS_ORDER = [
  "Белорусский язык",
  "Русский язык",
  "Белорусская литература",
  "Русская литература",
  "Иностранный язык",
  "Математика",
  "Алгебра",
  "Геометрия",
  "Информатика",
  "Физика",
  "Химия",
  "Биология",
  "География",
  "История Беларуси",
  "Всемирная история",
  "Обществоведение",
  "Физическая культура",
  "Трудовое обучение",
  "Искусство",
  "Музыка",
  "Черчение",
];

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getGradeColor(value: string): string {
  const numeric = Number(value);
  if (isNaN(numeric)) return "bg-blue-500";
  if (numeric === 10) return "bg-green-500";
  if (numeric >= 7) return "bg-blue-500";
  if (numeric >= 4) return "bg-yellow-500";
  return "bg-red-500";
}

// Получение учебного года (сентябрь текущего года - май следующего)
function getAcademicYearStart(year: number): Date {
  return new Date(year, 8, 1);
}

function getAcademicYearEnd(year: number): Date {
  return new Date(year + 1, 5, 31);
}

function isDateInAcademicYear(date: Date): boolean {
  const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  const start = getAcademicYearStart(year);
  const end = getAcademicYearEnd(year);
  return date >= start && date <= end;
}

function getAcademicYearString(date: Date): string {
  const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}/${year + 1}`;
}

export default function StudentDiary({
  grades,
  studentId,
  currentUserId,
  isTeacher = false,
  isParent = false,
  isHomeroomTeacher = false,
}: StudentDiaryProps) {
  const [selectedWeek, setSelectedWeek] = useState<Date>(getStartOfWeek(new Date()));
  const [studentNote, setStudentNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [teacherVerification, setTeacherVerification] = useState<{ teacherId: string; verifiedAt: Date } | null>(null);
  const [parentVerification, setParentVerification] = useState<{ parentId: string; verifiedAt: Date } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isParentVerifying, setIsParentVerifying] = useState(false);

  const subjectNames = Array.from(
    new Set(grades.map((g) => g.subjectName).filter(Boolean)) as Set<string>
  ).sort((a, b) => {
    const aIndex = SUBJECTS_ORDER.findIndex((s) => a.includes(s));
    const bIndex = SUBJECTS_ORDER.findIndex((s) => b.includes(s));
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const weekStart = selectedWeek;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 5);

  const weekGrades = grades.filter((g) => {
    if (!g.date) return false;
    const gradeDate = new Date(g.date);
    return gradeDate >= weekStart && gradeDate <= weekEnd;
  });

  const currentMonth = selectedWeek.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const weekNumber = getWeekNumber(selectedWeek);
  const academicYear = getAcademicYearString(selectedWeek);

  useEffect(() => {
    const loadNote = async () => {
      const weekStartStr = weekStart.toISOString().split("T")[0];
      const savedNote = await getDiaryNote(studentId, weekStartStr);
      if (savedNote) {
        setStudentNote(savedNote);
      } else {
        setStudentNote("");
      }
    };
    loadNote();
  }, [selectedWeek, studentId]);

  useEffect(() => {
    const loadVerifications = async () => {
      const weekStartStr = weekStart.toISOString().split("T")[0];

      const teacherVerif = await getDiaryVerification(studentId, weekStartStr);
      setTeacherVerification(teacherVerif);

      const parentVerif = await getParentVerification(studentId, weekStartStr);
      setParentVerification(parentVerif);
    };
    loadVerifications();
  }, [selectedWeek, studentId]);

  const handleSaveNote = useCallback(async () => {
    setIsSaving(true);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    await saveDiaryNote(studentId, weekStartStr, studentNote);
    setIsSaving(false);
  }, [studentId, weekStart, studentNote]);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStudentNote(e.target.value);
  }, []);

  const handleNoteBlur = useCallback(() => {
    handleSaveNote();
  }, [handleSaveNote]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (studentNote !== undefined) {
        handleSaveNote();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [studentNote, handleSaveNote]);

  const handleVerify = useCallback(async () => {
    if (!currentUserId || isVerifying) return;

    setIsVerifying(true);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const result = await verifyDiaryWeek(currentUserId, studentId, weekStartStr);

    if (result.success) {
      setTeacherVerification({
        teacherId: currentUserId,
        verifiedAt: new Date(),
      });
    }
    setIsVerifying(false);
  }, [currentUserId, studentId, weekStart, isVerifying]);

  const handleParentVerify = useCallback(async () => {
    if (!currentUserId || isParentVerifying) return;

    setIsParentVerifying(true);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const result = await verifyDiaryByParent(currentUserId, studentId, weekStartStr);

    if (result.success) {
      setParentVerification({
        parentId: currentUserId,
        verifiedAt: new Date(),
      });
    }
    setIsParentVerifying(false);
  }, [currentUserId, studentId, weekStart, isParentVerifying]);

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === "prev" ? -7 : 7));

    if (isDateInAcademicYear(newWeek)) {
      setSelectedWeek(newWeek);
    } else {
      alert("Неделя находится вне учебного года (сентябрь - май)");
    }
  };

  const canVerify = isHomeroomTeacher && currentUserId && !teacherVerification;
  const canParentVerify = isParent && currentUserId && !parentVerification;

  const getGradesForSubjectAndDay = (subjectName: string | null, dayOfWeek: number) => {
    return weekGrades.filter((g) => {
      if (!g.date) return false;
      const gradeDate = new Date(g.date);
      const gradeDay = gradeDate.getDay() || 7;
      return g.subjectName === subjectName && gradeDay === dayOfWeek;
    });
  };

  return (
    <div className="space-y-6">
      {/* Заголовок с навигацией */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center">
          <button
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center text-xl font-bold"
            onClick={() => navigateWeek("prev")}
            type="button"
          >
            ‹
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold capitalize">{currentMonth}</h2>
            <p className="text-sm opacity-90">
              Неделя {weekNumber} • Учебный год {academicYear}
            </p>
            <p className="text-xs opacity-75">
              {weekStart.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })} - {weekEnd.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
            </p>
          </div>
          <button
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center text-xl font-bold"
            onClick={() => navigateWeek("next")}
            type="button"
          >
            ›
          </button>
        </div>
      </div>

      {/* Таблица дневника */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="w-16 text-center py-4 text-sm font-semibold text-gray-600 border-r border-gray-200">№</th>
                <th className="min-w-[200px] text-left py-4 px-4 text-sm font-semibold text-gray-600 border-r border-gray-200">Предмет</th>
                {DAYS_OF_WEEK.map((day) => (
                  <th key={day.dayOfWeek} className="text-center min-w-[120px] py-4 px-2 border-r border-gray-200 last:border-r-0">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-gray-700">{day.name}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {new Date(weekStart.getTime() + (day.dayOfWeek - 1) * 86400000).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjectNames.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p>Нет предметов за эту неделю</p>
                    </div>
                  </td>
                </tr>
              ) : (
                subjectNames.map((subject, index) => (
                  <tr key={subject} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                    <td className="text-center py-4 font-mono text-gray-600 border-r border-gray-200">{index + 1}</td>
                    <td className="font-medium text-gray-800 px-4 py-4 border-r border-gray-200">{subject}</td>
                    {DAYS_OF_WEEK.map((day) => {
                      const dayGrades = getGradesForSubjectAndDay(subject, day.dayOfWeek);
                      return (
                        <td key={day.dayOfWeek} className="text-center py-4 px-2 border-r border-gray-200 last:border-r-0">
                          {dayGrades.length === 0 ? (
                            <span className="text-gray-300 text-xl">—</span>
                          ) : (
                            <div className="flex flex-col gap-2 items-center">
                              {dayGrades.map((grade) => (
                                <div key={grade.id} className="flex flex-col items-center">
                                  <span className={`w-10 h-10 rounded-lg ${getGradeColor(grade.value)} text-white font-bold flex items-center justify-center shadow-md`}>
                                    {grade.value}
                                  </span>
                                  {grade.comment && (
                                    <span className="text-xs text-gray-500 mt-1 max-w-[100px] truncate" title={grade.comment}>
                                      {grade.comment}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400 mt-0.5">
                                    {grade.date ? new Date(grade.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Заметки ученика */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <label className="text-lg font-bold text-gray-800">Заметки ученика</label>
          {isSaving && <span className="text-xs text-blue-500 font-medium">Сохранение...</span>}
        </div>
        <textarea
          className="w-full h-32 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
          placeholder="Личные заметки..."
          value={studentNote}
          onChange={handleNoteChange}
          onBlur={handleNoteBlur}
          disabled={isTeacher}
        />
        {!isTeacher && (
          <p className="text-xs text-gray-500 mt-2">
            Заметки сохраняются автоматически
          </p>
        )}
      </div>

      {/* Уведомления о верификации */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <label className="text-lg font-bold text-gray-800">Просмотр дневника</label>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Верификация классным руководителем */}
          {(isTeacher || isParent || isHomeroomTeacher) && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {teacherVerification ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Классный руководитель просмотрел</p>
                        <p className="text-xs text-gray-500">
                          {new Date(teacherVerification.verifiedAt).toLocaleDateString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Не просмотрен</span>
                        <p className="text-xs text-gray-400">классным руководителем</p>
                      </div>
                    </>
                  )}
                </div>
                {canVerify && (
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    type="button"
                  >
                    {isVerifying ? "..." : "Подтвердить"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Верификация родителями */}
          {(isTeacher || isParent || isHomeroomTeacher) && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {parentVerification ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Родители просмотрели</p>
                        <p className="text-xs text-gray-500">
                          {new Date(parentVerification.verifiedAt).toLocaleDateString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Не просмотрен</span>
                        <p className="text-xs text-gray-400">родителем</p>
                      </div>
                    </>
                  )}
                </div>
                {canParentVerify && (
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md"
                    onClick={handleParentVerify}
                    disabled={isParentVerifying}
                    type="button"
                  >
                    {isParentVerifying ? "..." : "Подтвердить"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
