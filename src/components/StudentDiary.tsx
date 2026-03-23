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

interface Lesson {
  id: number;
  lessonNumber: number;
  subjectName: string | null;
  teacherName: string | null;
  lessonDate: string | null;
  dayOfWeek: number | null;
}

interface StudentDiaryProps {
  grades: Grade[];
  studentId: string;
  currentUserId?: string;
  isTeacher?: boolean;
  isParent?: boolean;
  isHomeroomTeacher?: boolean;
  schedule?: Lesson[];
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
  schedule = [],
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

  // Сбрасываем время для корректного сравнения дат
  const weekStartOnlyDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const weekEndOnlyDate = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());

  const weekGrades = grades.filter((g) => {
    if (!g.date) return false;
    const gradeDate = new Date(g.date + "T00:00:00"); // устанавливаем время в полночь
    return gradeDate >= weekStartOnlyDate && gradeDate <= weekEndOnlyDate;
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
      const gradeDate = new Date(g.date + "T00:00:00");
      const gradeDay = gradeDate.getDay() || 7;
      // Фильтруем по дню недели И по предмету
      return gradeDay === dayOfWeek && g.subjectName === subjectName;
    });
  };

  // Форматирование даты для отображения
  const formatDateShort = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  };

  // Получение названия дня недели
  const getDayOfWeekName = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { weekday: "long" });
  };

  // Получаем предметы из расписания на текущую неделю для каждого дня
  const getScheduleForDay = (dayOfWeek: number) => {
    if (!schedule || schedule.length === 0) return [];
    
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];
    
    // Фильтруем расписание на даты текущей недели для этого дня
    const dateLessons = schedule.filter((lesson) => {
      if (!lesson.lessonDate) return false;
      const lessonDate = new Date(lesson.lessonDate);
      const lessonDay = lessonDate.getDay() || 7;
      return lessonDay === dayOfWeek && lesson.lessonDate >= weekStartStr && lesson.lessonDate <= weekEndStr;
    });
    
    // Фильтруем регулярное расписание для этого дня
    const regularLessons = schedule.filter((lesson) => {
      if (!lesson.dayOfWeek || lesson.lessonDate) return false;
      return lesson.dayOfWeek === dayOfWeek;
    });
    
    return [...dateLessons, ...regularLessons].sort((a, b) => a.lessonNumber - b.lessonNumber);
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
              {(() => {
                // Собираем все предметы из расписания на эту неделю
                const allLessons: Record<number, typeof schedule> = {};
                
                DAYS_OF_WEEK.forEach((day) => {
                  const daySchedule = getScheduleForDay(day.dayOfWeek);
                  daySchedule.forEach((lesson) => {
                    if (!allLessons[lesson.lessonNumber]) {
                      allLessons[lesson.lessonNumber] = [];
                    }
                    // Добавляем предмет, если его ещё нет на этом уроке
                    const exists = allLessons[lesson.lessonNumber].some(
                      (l) => l.subjectName === lesson.subjectName && l.dayOfWeek === day.dayOfWeek
                    );
                    if (!exists) {
                      allLessons[lesson.lessonNumber].push(lesson);
                    }
                  });
                });

                // Добавляем предметы из оценок, если их нет в расписании
                subjectNames.forEach((subject, idx) => {
                  // Проверяем, есть ли уже этот предмет на этом уроке
                  const lessonNum = idx + 1;
                  if (!allLessons[lessonNum]) {
                    allLessons[lessonNum] = [];
                  }
                  const exists = allLessons[lessonNum].some((l) => l.subjectName === subject);
                  if (!exists) {
                    // Добавляем предмет без привязки к дню (просто из оценок)
                    allLessons[lessonNum].push({
                      id: 0,
                      lessonNumber: lessonNum,
                      subjectName: subject,
                      teacherName: null,
                      lessonDate: null,
                      dayOfWeek: null,
                    });
                  }
                });

                const lessonNumbers = Object.keys(allLessons).map(Number).sort((a, b) => a - b);

                if (lessonNumbers.length === 0) {
                  return (
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
                  );
                }

                return lessonNumbers.map((lessonNum) => {
                  const lessons = allLessons[lessonNum] || [];
                  const subjectName = lessons[0]?.subjectName || subjectNames[lessonNum - 1] || "—";

                  return (
                    <tr key={lessonNum} className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                      <td className="text-center py-4 font-mono text-gray-600 border-r border-gray-200">{lessonNum}</td>
                      <td className="font-medium text-gray-800 px-4 py-4 border-r border-gray-200">{subjectName}</td>
                      {DAYS_OF_WEEK.map((day) => {
                        const dayLesson = lessons.find((l) => {
                          if (l.lessonDate) {
                            const lessonDate = new Date(l.lessonDate);
                            const lessonDay = lessonDate.getDay() || 7;
                            return lessonDay === day.dayOfWeek;
                          }
                          return l.dayOfWeek === day.dayOfWeek;
                        });
                        // Получаем оценки для этого предмета в этот день
                        const dayGrades = dayLesson ? getGradesForSubjectAndDay(dayLesson.subjectName, day.dayOfWeek) : [];
                        const hasLesson = dayLesson !== undefined;

                        return (
                          <td key={day.dayOfWeek} className="py-4 px-2 border-r border-gray-200 last:border-r-0">
                            <div className="flex items-start gap-2 justify-center flex-wrap">
                              {/* Оценки с tooltip */}
                              {dayGrades.map((grade) => (
                                <div key={grade.id} className="relative group">
                                  <span
                                    className={`w-10 h-10 rounded-lg ${getGradeColor(grade.value)} text-white font-bold flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110`}
                                  >
                                    {grade.value}
                                  </span>

                                  {/* Всплывающая подсказка */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
                                    <div className="font-semibold mb-1">{grade.subjectName || "Предмет"}</div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <span>{formatDateShort(grade.date)}</span>
                                    </div>
                                    {grade.teacherName && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>{grade.teacherName}</span>
                                      </div>
                                    )}
                                    {grade.comment && (
                                      <div className="flex items-start gap-2 mt-1 pt-1 border-t border-gray-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span className="text-gray-300 max-w-[200px] break-words">{grade.comment}</span>
                                      </div>
                                    )}
                                    {/* Стрелочка вниз */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              ))}

                              {/* Индикатор урока без оценок */}
                              {dayGrades.length === 0 && hasLesson && (
                                <div className="flex items-center justify-center h-full">
                                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                    {dayLesson?.lessonNumber} урок
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })()}
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

          {/* Верификация родителями */}
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
        </div>
      </div>
    </div>
  );
}
