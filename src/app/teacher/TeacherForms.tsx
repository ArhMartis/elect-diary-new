"use client";

import { useState, useEffect, useMemo } from "react";

function getGradeColor(value: string): string {
  const numeric = Number(value);
  if (isNaN(numeric)) return "bg-blue-500";
  if (numeric === 10) return "bg-emerald-500";
  if (numeric >= 9) return "bg-green-500";
  if (numeric >= 7) return "bg-blue-500";
  if (numeric >= 5) return "bg-yellow-500";
  if (numeric >= 4) return "bg-orange-500";
  return "bg-red-500";
}

interface Student {
  id: string;
  fullName: string | null;
}

interface Subject {
  id: number;
  name: string;
}

interface ScheduleItem {
  id: number;
  groupId: number;
  subjectId: number;
  subjectName: string;
  teacherId: string | null;
  teacherName: string | null;
  lessonDate: string | null;
  dayOfWeek: number | null;
  lessonNumber: number;
  quarter: number | null;
}

interface HomeworkItem {
  id: number;
  subjectId: number;
  subjectName: string;
  lessonDate: string;
  description: string;
  dueDate: string | null;
  teacherName: string | null;
}

interface TaughtGroup {
  id: number;
  name: string;
}

interface AcademicPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  groupId: number | null;
}

interface TeacherFormsProps {
  teacherId: string;
  groupId: number | null;
  groupName: string;
  students: Student[];
  taughtGroups?: TaughtGroup[];
  isHomeroomTeacher?: boolean;
}

const DAYS_OF_WEEK_TRANSLATIONS = ["", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const SHORT_DAYS = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const DAYS_OF_WEEK_LIST = ["", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

// Начало четвертей (месяц, день) - как в дневнике
const QUARTER_STARTS: Record<string, { month: number; day: number }> = {
  '1': { month: 8, day: 1 },   // 1 сентября
  '2': { month: 10, day: 4 },  // 4 ноября (после осенних каникул)
  '3': { month: 0, day: 9 },   // 9 января (после зимних каникул)
  '4': { month: 3, day: 1 },   // 1 апреля (после весенних каникул)
};

// Загрузка расписания из localStorage (как в дневнике)
function getClassScheduleLocal(groupId: number): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(`diary_schedule_${groupId}`);
  return data ? JSON.parse(data) : {};
}

// Определение четверти по дате (как в дневнике)
const getQuarterNumberByDate = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Каникулы возвращают четверть, которая начинается ПОСЛЕ каникул
  // Осенние каникулы: 28 окт - 3 нояб -> 2 четверть
  if (month === 10 && day >= 28) return '2';
  if (month === 11 && day <= 3) return '2';
  
  // Зимние каникулы: 25 дек - 8 янв -> 3 четверть
  if (month === 12 && day >= 25) return '3';
  if (month === 1 && day <= 8) return '3';
  
  // Весенние каникулы: 24 мар - 30 мар -> 4 четверть
  if (month === 3 && day >= 24 && day <= 30) return '4';
  
  // Летние каникулы: 1 июн - 31 авг -> 1 четверть (следующего года)
  if (month >= 6 && month <= 8) return '1';
  
  // Периоды четвертей:
  // 1 четверть: 1 сент - 27 окт
  if (month === 9 || (month === 10 && day <= 27)) return '1';
  
  // 2 четверть: 4 нояб - 24 дек
  if ((month === 11 && day >= 4) || (month === 12 && day <= 24)) return '2';
  
  // 3 четверть: 9 янв - 23 мар
  if ((month === 1 && day >= 9) || month === 2 || (month === 3 && day <= 23)) return '3';
  
  // 4 четверть: 1 апр - 31 мая
  if ((month === 3 && day >= 31) || month === 4 || month === 5) return '4';
  
  return '1';
};

export default function TeacherForms({
  teacherId,
  groupId,
  groupName,
  students,
  taughtGroups = [],
  isHomeroomTeacher = false,
}: TeacherFormsProps) {
  const [activeTab, setActiveTab] = useState<"homework" | "grades" | "attendance">("homework");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);

  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [selectedQuarter, setSelectedQuarter] = useState<string>(() => {
    // Определяем четверть по текущей дате при старте
    return getQuarterNumberByDate(new Date());
  });

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleModalFor, setScheduleModalFor] = useState<"homework" | "grades">("homework");
  const [selectedDay, setSelectedDay] = useState<string>("");

  const [homeworkForm, setHomeworkForm] = useState({
    scheduleId: "",
    subjectId: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [savingHomework, setSavingHomework] = useState(false);
  const [homeworkMessage, setHomeworkMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const MAX_HOMEWORK_LENGTH = 50;

  const [gradeForm, setGradeForm] = useState({
    studentId: "",
    scheduleId: "",
    subjectId: "",
    value: "",
    date: new Date().toISOString().split("T")[0],
    comment: "",
  });
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeMessage, setGradeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split("T")[0],
    attendance: {} as Record<string, "present" | "absent" | "unexcused">,
  });
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Загрузка предметов (один раз)
  useEffect(() => {
    if (groupId) {
      setLoadingSubjects(true);
      fetch(`/api/subjects?groupId=${groupId}&teacherId=${teacherId}`)
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setSubjects(data); })
        .catch((err) => console.error("Ошибка загрузки предметов:", err))
        .finally(() => setLoadingSubjects(false));

      fetch(`/api/academic-periods?groupId=${groupId}`)
        .then((res) => res.json())
        .then((data) => { if (Array.isArray(data)) setAcademicPeriods(data); })
        .catch((err) => console.error("Ошибка загрузки четвертей:", err));
    }
  }, [groupId, teacherId]);

  // Загружаем расписание по выбранной четверти
  useEffect(() => {
    if (!groupId) return;
    setLoadingSchedule(true);
    fetch(`/api/schedule?groupId=${groupId}&quarter=${selectedQuarter}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => { if (Array.isArray(data)) setSchedule(data); })
      .catch((err) => console.error("Ошибка загрузки расписания:", err))
      .finally(() => setLoadingSchedule(false));
  }, [groupId, selectedQuarter]);

  // Загружаем домашку
  useEffect(() => {
    if (!groupId) return;
    fetch(`/api/homework?groupId=${groupId}`)
      .then(async (res) => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); return res.json(); })
      .then((data) => { if (Array.isArray(data)) setHomeworkList(data); })
      .catch((err) => console.error("Ошибка загрузки ДЗ:", err));
  }, [groupId, subjects]);

  // Функция для получения даты начала четверти (должна быть до использования в useMemo)
  const getQuarterStartDate = (quarter: string): Date => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Определяем текущий учебный год
    const academicYearStart = currentMonth < 8 ? currentYear - 1 : currentYear;
    
    const quarterStart = QUARTER_STARTS[quarter];
    if (!quarterStart) return new Date();
    
    // Для 3 и 4 четверти год следующий
    const year = quarter === '3' || quarter === '4' ? academicYearStart + 1 : academicYearStart;
    return new Date(year, quarterStart.month, quarterStart.day);
  };

  useEffect(() => {
    const initialAttendance: Record<string, "present" | "absent" | "unexcused"> = {};
    students.forEach((s) => { initialAttendance[s.id] = "present"; });
    setAttendanceForm((prev) => ({ ...prev, attendance: initialAttendance }));
  }, [attendanceForm.date, students]);

  const teacherSubjectIds = useMemo(() => new Set(subjects.map((s) => s.id)), [subjects]);

  // Дедупликация расписания - оставляем только уникальные уроки
  const uniqueSchedule = useMemo(() => {
    const seen = new Map<string, ScheduleItem>();
    
    for (const item of schedule) {
      const day = item.dayOfWeek ?? 0;
      // Ключ: день недели + номер урока (без subjectId, так как в одно время может быть только один урок)
      const key = `${day}-${item.lessonNumber}`;
      
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }
    
    return Array.from(seen.values());
  }, [schedule]);

  // Расписание уже отфильтровано по четверти из БД
  // Записи с quarter=null показываем для всех четвертей
  const scheduleForCurrentQuarter = useMemo(() => {
    return uniqueSchedule.filter((item) => {
      // Если quarter не указан — урок для всех четвертей
      if (!item.lessonDate) return true;
      // Если есть конкретная дата — показываем всё равно
      return true;
    });
  }, [uniqueSchedule]);

  const scheduleByDayOfWeek = useMemo(() => {
    const map: Record<number, ScheduleItem[]> = {};
    
    for (const item of scheduleForCurrentQuarter) {
      const day = item.dayOfWeek ?? 0;
      if (!map[day]) map[day] = [];
      map[day].push(item);
    }
    
    for (const key of Object.keys(map)) {
      map[Number(key)].sort((a, b) => a.lessonNumber - b.lessonNumber);
    }
    return map;
  }, [scheduleForCurrentQuarter]);

  const getHomeworkForDate = useMemo(() => {
    return (dateStr: string, subjectId: number) => {
      return homeworkList.find(
        (hw) => hw.lessonDate === dateStr && hw.subjectId === subjectId
      );
    };
  }, [homeworkList]);

  const weekDates = useMemo(() => {
    const dates: { dayOfWeek: number; date: Date; dateStr: string }[] = [];
    for (let i = 1; i <= 6; i++) {
      const d = new Date(selectedWeek);
      d.setDate(d.getDate() + (i - 1));
      dates.push({
        dayOfWeek: i,
        date: d,
        dateStr: d.toISOString().split("T")[0],
      });
    }
    return dates;
  }, [selectedWeek]);

  const navigateWeek = (direction: "prev" | "next") => {
    setSelectedWeek((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      
      // Проверяем границы учебного года (сентябрь - май)
      if (!isDateInAcademicYear(newDate)) {
        return prev; // Не меняем дату, если выходим за границы
      }
      
      // Обновляем четверть при переключении недели (как в дневнике)
      const quarter = getQuarterNumberByDate(newDate);
      setSelectedQuarter(quarter);
      
      return newDate;
    });
  };

  const getAcademicWeekNumber = (date: Date) => {
    // Учебный год начинается 1 сентября
    const year = date.getFullYear();
    const month = date.getMonth();
    // Если сейчас январь-август, учебный год начался в прошлом году
    const academicYearStart = month < 8 ? year - 1 : year;
    const start = new Date(academicYearStart, 8, 1); // 1 сентября
    start.setHours(0, 0, 0, 0);
    
    const diff = date.getTime() - start.getTime();
    const weekNumber = Math.ceil((diff / (7 * 24 * 60 * 60 * 1000)) + 1);
    return weekNumber > 0 ? weekNumber : 1;
  };

  const getAcademicYear = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // Если сейчас январь-август, учебный год начался в прошлом году
    return month < 8 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
  };

  // Проверка, что дата в пределах учебного года (сентябрь - май)
  const isDateInAcademicYear = (date: Date): boolean => {
    const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
    const start = new Date(year, 8, 1); // 1 сентября
    const end = new Date(year + 1, 4, 31); // 31 мая
    return date >= start && date <= end;
  };

  const getNextLessonForSubject = (currentScheduleId: string) => {
    const currentItem = schedule.find((s) => s.id === parseInt(currentScheduleId));
    if (!currentItem) return null;
    const sameSubjectLessons = schedule
      .filter((s) => s.subjectId === currentItem.subjectId && s.id !== currentItem.id && s.lessonDate && currentItem.lessonDate && s.lessonDate > currentItem.lessonDate)
      .sort((a, b) => { if (!a.lessonDate || !b.lessonDate) return 0; return new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime(); });
    return sameSubjectLessons[0] || null;
  };

  const openScheduleModal = (forTab: "homework" | "grades") => {
    setScheduleModalFor(forTab);
    setSelectedDay("");
    setShowScheduleModal(true);
  };

  const handleSelectLesson = (item: ScheduleItem) => {
    if (scheduleModalFor === "homework") {
      setHomeworkForm((prev) => ({ ...prev, scheduleId: String(item.id), subjectId: String(item.subjectId) }));
    } else {
      setGradeForm((prev) => ({ ...prev, scheduleId: String(item.id), subjectId: String(item.subjectId), date: item.lessonDate || prev.date }));
    }
    setShowScheduleModal(false);
  };

  const handleLessonClick = (item: ScheduleItem, tab: "homework" | "grades") => {
    const dateStr = selectedWeek.toISOString().split("T")[0];
    const dayOfWeek = item.dayOfWeek ?? 1;
    const d = new Date(selectedWeek);
    d.setDate(d.getDate() + (dayOfWeek - 1));
    const lessonDate = d.toISOString().split("T")[0];

    if (tab === "homework") {
      setActiveTab("homework");
      setHomeworkForm((prev) => ({
        ...prev,
        scheduleId: String(item.id),
        subjectId: String(item.subjectId),
        date: lessonDate,
      }));
    } else {
      setActiveTab("grades");
      setGradeForm((prev) => ({
        ...prev,
        scheduleId: String(item.id),
        subjectId: String(item.subjectId),
        date: lessonDate,
      }));
    }
  };

  const handleHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    const selectedSchedule = homeworkForm.scheduleId ? schedule.find((s) => s.id === parseInt(homeworkForm.scheduleId)) : null;
    if (!selectedSchedule && !homeworkForm.subjectId) { setHomeworkMessage({ type: "error", text: "Выберите предмет и урок из расписания" }); return; }
    const nextLesson = homeworkForm.scheduleId ? getNextLessonForSubject(homeworkForm.scheduleId) : null;
    const subjectId = selectedSchedule ? selectedSchedule.subjectId : parseInt(homeworkForm.subjectId);
    setSavingHomework(true);
    setHomeworkMessage(null);
    try {
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, groupId, subjectId, lessonDate: selectedSchedule?.lessonDate || homeworkForm.date || null, description: homeworkForm.description, dueDate: nextLesson?.lessonDate || null }),
      });
      if (response.ok) {
        setHomeworkMessage({ type: "success", text: `Домашнее задание добавлено! ${nextLesson ? `Срок сдачи: ${formatDate(nextLesson.lessonDate)} (${nextLesson.subjectName})` : "Срок сдачи не указан"}` });
        setHomeworkForm({ scheduleId: "", subjectId: "", description: "", date: new Date().toISOString().split("T")[0] });
        fetch(`/api/homework?groupId=${groupId}`).then(res => res.json()).then(data => { if (Array.isArray(data)) setHomeworkList(data); });
      } else {
        const error = await response.json();
        setHomeworkMessage({ type: "error", text: error.error || "Ошибка при сохранении" });
      }
    } catch { setHomeworkMessage({ type: "error", text: "Ошибка сети" }); }
    finally { setSavingHomework(false); }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSchedule = schedule.find((s) => s.id === parseInt(gradeForm.scheduleId));
    const date = selectedSchedule?.lessonDate || gradeForm.date;
    setSavingGrade(true);
    setGradeMessage(null);
    try {
      const response = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: gradeForm.studentId, subjectId: parseInt(gradeForm.subjectId), teacherId, value: gradeForm.value, date, comment: gradeForm.comment || null }),
      });
      if (response.ok) { setGradeMessage({ type: "success", text: "Оценка успешно выставлена!" }); setGradeForm({ studentId: "", scheduleId: "", subjectId: "", value: "", date: new Date().toISOString().split("T")[0], comment: "" }); }
      else if (response.status === 409) { setGradeMessage({ type: "error", text: "Оценка уже существует на эту дату" }); }
      else { const error = await response.json(); setGradeMessage({ type: "error", text: error.error || "Ошибка при сохранении" }); }
    } catch { setGradeMessage({ type: "error", text: "Ошибка сети" }); }
    finally { setSavingGrade(false); }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAttendance(true);
    setAttendanceMessage(null);
    try {
      const absences = Object.entries(attendanceForm.attendance).filter(([_, status]) => status !== "present").map(([studentId, status]) => ({ studentId, date: attendanceForm.date, type: status }));
      await Promise.all(absences.map((absence) => fetch("/api/absences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: absence.studentId, date: absence.date, type: absence.type }) })));
      setAttendanceMessage({ type: "success", text: "Посещаемость отмечена!" });
    } catch { setAttendanceMessage({ type: "error", text: "Ошибка при сохранении" }); }
    finally { setSavingAttendance(false); }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };

  const getDayOfWeek = (dayOfWeek: number | null) => {
    if (!dayOfWeek) return "";
    return DAYS_OF_WEEK_TRANSLATIONS[dayOfWeek] || "";
  };

  const currentModalSubjectId = scheduleModalFor === "homework" ? parseInt(homeworkForm.subjectId) : parseInt(gradeForm.subjectId);
  const currentModalSubjectName = subjects.find((s) => s.id === currentModalSubjectId)?.name || "";

  if (!groupId) return null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {showScheduleModal && currentModalSubjectId && (
        <SchedulePickerModal
          subjectId={currentModalSubjectId}
          subjectName={currentModalSubjectName}
          schedule={schedule}
          selectedQuarter={selectedQuarter}
          setSelectedQuarter={setSelectedQuarter}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          onSelectLesson={handleSelectLesson}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {/* ===== WEEKLY SCHEDULE VIEW ===== */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Управление классом</h2>
            <p className="text-slate-400 text-sm mt-0.5 font-medium">для {groupName}</p>
          </div>
        </div>
      </div>

      {taughtGroups.length > 0 && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <h3 className="text-xs font-bold text-amber-800 mb-1.5 flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" /></svg>
            Вы также преподаете в классах:
          </h3>
          <div className="flex flex-wrap gap-1.5">{taughtGroups.map((g) => (<span key={g.id} className="px-2.5 py-1 bg-white border border-amber-300 text-amber-800 rounded-lg text-xs font-bold">{g.name}</span>))}</div>
        </div>
      )}

      {/* Легенда */}
      <div className="mx-6 mt-3 p-3 bg-gray-50 rounded-xl flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
          <span className="text-gray-700 font-medium">Ваши уроки (кликабельны)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100/50 border border-gray-100 rounded opacity-50"></div>
          <span className="text-gray-500">Уроки других учителей</span>
        </div>
      </div>

      {/* ===== WEEKLY SCHEDULE ===== */}
      <div className="px-6 pt-4">
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl border border-indigo-100 overflow-hidden">
          {/* Week nav header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5">
            <div className="flex items-center justify-between">
              <button onClick={() => navigateWeek("prev")} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg font-bold transition-colors">&lsaquo;</button>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {selectedWeek.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} &mdash; {" "}
                  {new Date(selectedWeek.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                </h3>
                <p className="text-indigo-200 text-xs font-medium">
                  Неделя {getAcademicWeekNumber(selectedWeek)} &bull; {selectedQuarter === "1" ? "I" : selectedQuarter === "2" ? "II" : selectedQuarter === "3" ? "III" : "IV"} четверть &bull; {getAcademicYear(selectedWeek)} уч.г.
                </p>
              </div>
              <button onClick={() => navigateWeek("next")} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg font-bold transition-colors">&rsaquo;</button>
            </div>
            <div className="flex justify-center mt-2">
              <select
                value={selectedQuarter}
                onChange={(e) => {
                  const q = e.target.value;
                  setSelectedQuarter(q);
                  // Устанавливаем неделю на начало выбранной четверти
                  const quarterStart = getQuarterStartDate(q);
                  const day = quarterStart.getDay();
                  const monday = new Date(quarterStart);
                  monday.setDate(quarterStart.getDate() - ((day + 6) % 7));
                  monday.setHours(0, 0, 0, 0);
                  setSelectedWeek(monday);
                }}
                className="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-semibold border border-white/30 focus:outline-none"
              >
                <option value="1" className="text-gray-900">I четверть</option>
                <option value="2" className="text-gray-900">II четверть</option>
                <option value="3" className="text-gray-900">III четверть</option>
                <option value="4" className="text-gray-900">IV четверть</option>
              </select>
            </div>
          </div>

          {/* Schedule grid by days */}
          <div className="p-4">
            {loadingSchedule ? (
              <div className="text-center py-8 text-gray-400 font-medium">Загрузка расписания...</div>
            ) : schedule.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" clipRule="evenodd" /></svg>
                <p className="text-gray-500 font-medium">Нет уроков в расписании</p>
                <p className="text-gray-400 text-sm mt-1">Добавьте расписание через Админ → Расписание</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {weekDates.map(({ dayOfWeek, date, dateStr }) => {
                  const dayLessons = scheduleByDayOfWeek[dayOfWeek] || [];
                  const isToday = new Date().toISOString().split("T")[0] === dateStr;
                  return (
                    <div key={dayOfWeek} className={`rounded-xl border-2 p-3 transition-all ${isToday ? "bg-white border-indigo-400 shadow-md shadow-indigo-100/50" : "bg-white border-gray-100 hover:border-indigo-200"}`}>
                      <div className={`flex items-center justify-between mb-2 ${isToday ? "bg-indigo-50 -mx-3 -mt-3 px-3 py-1.5 rounded-t-xl border-b border-indigo-200" : ""}`}>
                        <div>
                          <h4 className={`text-sm font-bold ${isToday ? "text-indigo-800" : "text-gray-800"}`}>
                            {DAYS_OF_WEEK_TRANSLATIONS[dayOfWeek]}
                          </h4>
                          <p className={`text-[11px] font-medium ${isToday ? "text-indigo-600" : "text-gray-400"}`}>
                            {date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                          </p>
                        </div>
                        {isToday && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded-full">Сегодня</span>}
                      </div>
                      {dayLessons.length === 0 ? (
                        <p className="text-xs text-gray-300 text-center py-3 italic">Нет уроков</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayLessons.map((lesson) => {
                            const hw = getHomeworkForDate(dateStr, lesson.subjectId);
                            const isTeacherLesson = subjects.length > 0 && teacherSubjectIds.has(lesson.subjectId);
                            // Уникальный ключ без lesson.id (чтобы избежать дубликатов)
                            const uniqueKey = `${lesson.dayOfWeek}-${lesson.subjectId}-${lesson.lessonNumber}`;
                            return (
                              <div key={uniqueKey} className={`group relative ${!isTeacherLesson ? "opacity-50" : ""}`}>
                                <button
                                  type="button"
                                  onClick={() => isTeacherLesson && handleLessonClick(lesson, activeTab === "attendance" ? "homework" : activeTab)}
                                  disabled={!isTeacherLesson}
                                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                                    !isTeacherLesson
                                      ? "bg-gray-100/50 border-gray-100 cursor-default"
                                      : isToday
                                        ? "bg-indigo-50/50 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer"
                                        : "bg-gray-50/50 border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer"
                                  }`}
                                  title={isTeacherLesson ? "Нажмите, чтобы выбрать урок" : "Этот предмет не закреплён за вами"}
                                >
                                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${
                                    !isTeacherLesson
                                      ? "bg-gray-200 text-gray-400"
                                      : isToday
                                        ? "bg-indigo-200 text-indigo-800"
                                        : "bg-gray-200 text-gray-700"
                                  }`}>
                                    {lesson.lessonNumber}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-xs font-bold block truncate ${
                                      !isTeacherLesson ? "text-gray-500" : isToday ? "text-indigo-900" : "text-gray-800"
                                    }`}>
                                      {lesson.subjectName}
                                    </span>
                                    {hw && isTeacherLesson && (
                                      <span className="text-[10px] text-amber-600 font-medium block truncate" title={hw.description}>
                                        📝 {hw.description}
                                      </span>
                                    )}
                                  </div>
                                  {isTeacherLesson && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="px-6 pt-5 flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("homework")}
          className={`px-5 py-3 font-semibold text-sm tracking-wide border-b-2 transition-all ${
            activeTab === "homework" ? "border-blue-600 text-blue-700 bg-blue-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
            Домашнее задание
          </span>
        </button>
        <button
          onClick={() => setActiveTab("grades")}
          className={`px-5 py-3 font-semibold text-sm tracking-wide border-b-2 transition-all ${
            activeTab === "grades" ? "border-purple-600 text-purple-700 bg-purple-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Выставить оценку
          </span>
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-5 py-3 font-semibold text-sm tracking-wide border-b-2 transition-all ${
            activeTab === "attendance" ? "border-amber-600 text-amber-700 bg-amber-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Отметка отсутствующих
          </span>
        </button>
      </div>

      <div className="p-6">
        {/* ===== HOMEWORK TAB ===== */}
        {activeTab === "homework" && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-xl font-bold text-gray-900 mb-1 tracking-tight flex items-center gap-3">
              <span className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-lg">📝</span>
              Добавить домашнее задание
            </h3>

            {homeworkMessage && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${homeworkMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                {homeworkMessage.text}
              </div>
            )}

            <form onSubmit={handleHomeworkSubmit} className="mt-5 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 tracking-wide">
                  Выберите предмет <span className="text-red-400">*</span>
                </label>
                {loadingSubjects ? (
                  <div className="p-4 bg-white rounded-xl text-gray-500 font-medium text-sm">Загрузка предметов...</div>
                ) : subjects.length === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-xl text-amber-700 border border-amber-200 text-sm font-medium">
                    Нет предметов. Убедитесь, что вам назначены предметы через Админ → Предметы.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => setHomeworkForm((prev) => ({ ...prev, subjectId: String(subject.id), scheduleId: "" }))}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                          homeworkForm.subjectId === String(subject.id)
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200/50"
                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {subject.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {homeworkForm.subjectId && (
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5 tracking-wide">
                    Урок из расписания
                  </label>
                  <button
                    type="button"
                    onClick={() => openScheduleModal("homework")}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                  >
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                      {homeworkForm.scheduleId
                        ? (() => { const sel = schedule.find((s) => s.id === parseInt(homeworkForm.scheduleId)); return sel ? `${getDayOfWeek(sel.dayOfWeek)}, ${sel.lessonNumber} урок — ${sel.subjectName}${sel.lessonDate ? ` (${formatDate(sel.lessonDate)})` : ""}` : "Выбрать урок из расписания"; })()
                        : "Выбрать урок из расписания"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                  </button>
                  {homeworkForm.scheduleId && (
                    <button type="button" onClick={() => setHomeworkForm((prev) => ({ ...prev, scheduleId: "" }))} className="mt-1.5 text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">Сбросить выбор</button>
                  )}
                </div>
              )}

              {homeworkForm.scheduleId && (() => {
                const nextLesson = getNextLessonForSubject(homeworkForm.scheduleId);
                return (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                      Срок сдачи:
                    </p>
                    {nextLesson ? (<p className="text-sm text-amber-700 mt-1 font-medium">{formatDate(nextLesson.lessonDate)} — {nextLesson.subjectName} ({getDayOfWeek(nextLesson.dayOfWeek)}, {nextLesson.lessonNumber} урок)</p>) : (<p className="text-sm text-amber-600 mt-1">Следующий урок не найден в расписании</p>)}
                  </div>
                );
              })()}

              {!homeworkForm.scheduleId && homeworkForm.subjectId && schedule.length === 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5 tracking-wide">Дата урока <span className="text-red-400">*</span></label>
                  <input type="date" value={homeworkForm.date} onChange={(e) => setHomeworkForm((prev) => ({ ...prev, date: e.target.value }))} className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-gray-900 font-medium" />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 tracking-wide">
                  Описание задания <span className="text-red-400">*</span>
                  <span className="text-gray-400 font-normal ml-2">({homeworkForm.description.length}/{MAX_HOMEWORK_LENGTH})</span>
                </label>
                <textarea
                  value={homeworkForm.description}
                  onChange={(e) => { if (e.target.value.length <= MAX_HOMEWORK_LENGTH) setHomeworkForm((prev) => ({ ...prev, description: e.target.value })); }}
                  required rows={4} placeholder="Введите текст домашнего задания..."
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-gray-900 font-medium resize-none"
                />
                {homeworkForm.description.length >= MAX_HOMEWORK_LENGTH && (<p className="text-red-400 text-xs mt-1 font-medium">Достигнуто максимальное количество символов</p>)}
              </div>

              <button type="submit" disabled={savingHomework || (!homeworkForm.scheduleId && !homeworkForm.subjectId)} className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-200/40 text-sm tracking-wide">
                {savingHomework ? (
                  <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Сохранение...</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Добавить домашнее задание</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ===== GRADES TAB ===== */}
        {activeTab === "grades" && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="text-xl font-bold text-gray-900 mb-1 tracking-tight flex items-center gap-3">
              <span className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 text-lg">⭐</span>
              Выставить оценку
            </h3>

            {gradeMessage && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${gradeMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                {gradeMessage.text}
              </div>
            )}

            <form onSubmit={handleGradeSubmit} className="mt-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5 tracking-wide">Ученик <span className="text-red-400">*</span></label>
                  <select value={gradeForm.studentId} onChange={(e) => setGradeForm((prev) => ({ ...prev, studentId: e.target.value }))} required className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-medium">
                    <option value="">Выберите ученика</option>
                    {students.map((s) => (<option key={s.id} value={s.id}>{s.fullName}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5 tracking-wide">Выберите предмет <span className="text-red-400">*</span></label>
                  {loadingSubjects ? (
                    <div className="p-3 bg-white rounded-xl text-gray-500 font-medium text-sm">Загрузка предметов...</div>
                  ) : subjects.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-700 border border-amber-200 text-sm font-medium">Нет предметов.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject) => (
                        <button key={subject.id} type="button" onClick={() => setGradeForm((prev) => ({ ...prev, subjectId: String(subject.id), scheduleId: "" }))} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${gradeForm.subjectId === String(subject.id) ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200/50" : "bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50"}`}>
                          {subject.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {gradeForm.subjectId && (
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5 tracking-wide">Урок из расписания</label>
                  <button type="button" onClick={() => openScheduleModal("grades")} className="w-full flex items-center justify-between px-5 py-3.5 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50/50 transition-all group">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                      {gradeForm.scheduleId ? (() => { const sel = schedule.find((s) => s.id === parseInt(gradeForm.scheduleId)); return sel ? `${getDayOfWeek(sel.dayOfWeek)}, ${sel.lessonNumber} урок — ${sel.subjectName}${sel.lessonDate ? ` (${formatDate(sel.lessonDate)})` : ""}` : "Выбрать урок из расписания"; })() : "Выбрать урок из расписания"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 000 2h6a1 1 0 100-2H7zm0 4a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                  </button>
                  {gradeForm.scheduleId && (<button type="button" onClick={() => setGradeForm((prev) => ({ ...prev, scheduleId: "" }))} className="mt-1.5 text-xs text-gray-400 hover:text-red-500 font-medium transition-colors">Сбросить выбор</button>)}
                </div>
              )}

              {!gradeForm.scheduleId && (
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5 tracking-wide">Или укажите дату вручную <span className="text-red-400">*</span></label>
                  <input type="date" value={gradeForm.date} onChange={(e) => setGradeForm((prev) => ({ ...prev, date: e.target.value }))} className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-medium" />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">Оценка (10-балльная) <span className="text-red-400">*</span></label>
                <div className="flex flex-wrap gap-2.5">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((grade) => {
                    const isSelected = gradeForm.value === grade.toString();
                    const getGradeColor = (g: number) => { if (g >= 9) return "from-emerald-400 to-emerald-500"; if (g >= 7) return "from-blue-400 to-blue-500"; if (g >= 5) return "from-yellow-400 to-yellow-500"; if (g >= 4) return "from-orange-400 to-orange-500"; return "from-red-400 to-red-500"; };
                    const getGradeLabel = (g: number) => { if (g >= 9) return "Отлично"; if (g >= 7) return "Хорошо"; if (g >= 5) return "Удовл."; if (g >= 4) return "Неуд."; return "Плохо"; };
                    return (
                      <button key={grade} type="button" onClick={() => setGradeForm((prev) => ({ ...prev, value: grade.toString() }))}
                        className={`relative w-16 h-20 rounded-2xl font-extrabold text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg bg-gradient-to-br ${getGradeColor(grade)} ${isSelected ? "ring-4 ring-offset-2 scale-110" : "opacity-75 hover:opacity-100"}`}
                        style={isSelected ? { '--tw-ring-color': grade >= 9 ? '#34d399' : grade >= 7 ? '#60a5fa' : grade >= 5 ? '#facc15' : grade >= 4 ? '#fb923c' : '#f87171' } as React.CSSProperties : {}}
                      >
                        <span className="text-2xl">{grade}</span>
                        <span className="block text-[10px] font-semibold mt-0.5 opacity-90">{getGradeLabel(grade)}</span>
                        {isSelected && (<span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"><svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></span>)}
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" value={gradeForm.value} required />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2.5 tracking-wide">Комментарий</label>
                <input type="text" value={gradeForm.comment} onChange={(e) => setGradeForm((prev) => ({ ...prev, comment: e.target.value }))} placeholder="Например: контрольная работа..." className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-medium" />
              </div>

              <button type="submit" disabled={savingGrade || !gradeForm.studentId || !gradeForm.subjectId || !gradeForm.value} className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-200/40 text-sm tracking-wide">
                {savingGrade ? (<span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Сохранение...</span>) : (<span className="flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Выставить оценку</span>)}
              </button>
            </form>
          </div>
        )}

        {/* ===== ATTENDANCE TAB ===== */}
        {activeTab === "attendance" && (
          <div 
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100"
            style={{ 
              overflowAnchor: 'none',
              contain: 'layout style paint'
            }}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-1 tracking-tight flex items-center gap-3">
              <span className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 text-lg">📋</span>
              Отметка отсутствующих
            </h3>
            
            {/* Селектор четверти */}
            <div className="ml-[52px] mt-2 flex items-center gap-3">
              <select
                value={selectedQuarter}
                onChange={(e) => {
                  const q = e.target.value;
                  setSelectedQuarter(q);
                  // Устанавливаем неделю на начало выбранной четверти
                  const quarterStart = getQuarterStartDate(q);
                  const day = quarterStart.getDay();
                  const monday = new Date(quarterStart);
                  monday.setDate(quarterStart.getDate() - ((day + 6) % 7));
                  monday.setHours(0, 0, 0, 0);
                  setSelectedWeek(monday);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border-2 border-amber-300 text-amber-800 text-sm font-semibold focus:outline-none focus:border-amber-500 cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <option value="1">I четверть</option>
                <option value="2">II четверть</option>
                <option value="3">III четверть</option>
                <option value="4">IV четверть</option>
              </select>
              <span className="text-xs text-amber-600">
                Выберите четверть для просмотра расписания
              </span>
            </div>

            {attendanceMessage && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium ${attendanceMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                {attendanceMessage.text}
              </div>
            )}

            <form onSubmit={handleAttendanceSubmit} className="mt-5 space-y-5">
              {/* Выбор даты и урока */}
              <div className="bg-white rounded-xl p-4 border border-amber-200">
                <label className="block text-sm font-bold text-amber-900 mb-3 tracking-wide">Выберите дату и урок из расписания <span className="text-red-400">*</span></label>
                
                {/* Навигация по неделям */}
                <div className="flex items-center justify-between mb-3 bg-amber-50 rounded-lg p-2">
                  <button type="button" onClick={() => navigateWeek("prev")} className="w-8 h-8 rounded-full bg-white border border-amber-200 hover:bg-amber-100 flex items-center justify-center text-amber-700 font-bold transition-colors">‹</button>
                  <span className="text-sm font-semibold text-amber-800">
                    {selectedWeek.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} — {" "}
                    {new Date(selectedWeek.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                  </span>
                  <button type="button" onClick={() => navigateWeek("next")} className="w-8 h-8 rounded-full bg-white border border-amber-200 hover:bg-amber-100 flex items-center justify-center text-amber-700 font-bold transition-colors">›</button>
                </div>

                {/* Дни недели с уроками */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {weekDates.map(({ dayOfWeek, date, dateStr }) => {
                    const dayLessons = scheduleByDayOfWeek[dayOfWeek] || [];
                    const isSelected = attendanceForm.date === dateStr;
                    const dayName = DAYS_OF_WEEK_TRANSLATIONS[dayOfWeek];
                    return (
                      <button
                        key={dayOfWeek}
                        type="button"
                        onClick={() => dayLessons.length > 0 && setAttendanceForm((prev) => ({ ...prev, date: dateStr }))}
                        disabled={dayLessons.length === 0}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "bg-amber-100 border-amber-400"
                            : dayLessons.length > 0
                              ? "bg-white border-gray-200 hover:border-amber-300"
                              : "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="text-xs font-bold text-gray-700">{dayName}</div>
                        <div className="text-[10px] text-gray-500">{date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}</div>
                        <div className="text-[10px] text-amber-600 mt-1">{dayLessons.length} уроков</div>
                      </button>
                    );
                  })}
                </div>

                {/* Выбранная дата */}
                {attendanceForm.date && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="text-sm font-semibold text-amber-800 mb-2">
                      📅 {new Date(attendanceForm.date).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                    <div className="text-xs text-gray-600">
                      Отметьте статус присутствия для каждого ученика ниже
                    </div>
                  </div>
                )}

                {/* Или ручной ввод даты */}
                {!attendanceForm.date && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Или укажите дату вручную:</label>
                    <input 
                      type="date" 
                      value={attendanceForm.date} 
                      onChange={(e) => setAttendanceForm((prev) => ({ ...prev, date: e.target.value }))} 
                      className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none bg-white text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 bg-amber-100/80 font-bold text-amber-900 text-sm">
                  <div className="col-span-5">Ученик</div>
                  <div className="col-span-7 text-center">Статус</div>
                </div>
                <div className="divide-y divide-amber-50">
                  {students.map((student) => (
                    <div key={student.id} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-amber-50/30">
                      <div className="col-span-5 font-semibold text-gray-800">{student.fullName}</div>
                      <div className="col-span-7 flex justify-center gap-2">
                        <button type="button" onClick={() => setAttendanceForm({ ...attendanceForm, attendance: { ...attendanceForm.attendance, [student.id]: "present" } })} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${attendanceForm.attendance[student.id] === "present" ? "bg-emerald-500 text-white shadow-md shadow-emerald-200/50" : "bg-gray-100 text-gray-600 hover:bg-emerald-50"}`}>✓ Присутствует</button>
                        <button type="button" onClick={() => setAttendanceForm({ ...attendanceForm, attendance: { ...attendanceForm.attendance, [student.id]: "absent" } })} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${attendanceForm.attendance[student.id] === "absent" ? "bg-yellow-500 text-white shadow-md shadow-yellow-200/50" : "bg-gray-100 text-gray-600 hover:bg-yellow-50"}`}>⚠ Пропуск</button>
                        <button type="button" onClick={() => setAttendanceForm({ ...attendanceForm, attendance: { ...attendanceForm.attendance, [student.id]: "unexcused" } })} className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${attendanceForm.attendance[student.id] === "unexcused" ? "bg-red-500 text-white shadow-md shadow-red-200/50" : "bg-gray-100 text-gray-600 hover:bg-red-50"}`}>✗ Неуваж.</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={savingAttendance || !attendanceForm.date} className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-200/40 text-sm tracking-wide">
                {savingAttendance ? (<span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Сохранение...</span>) : (<span className="flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Сохранить посещаемость</span>)}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function SchedulePickerModal({
  subjectId, subjectName, schedule, selectedQuarter, setSelectedQuarter, selectedDay, setSelectedDay, onSelectLesson, onClose,
}: {
  subjectId: number; subjectName: string; schedule: ScheduleItem[];
  selectedQuarter: string; setSelectedQuarter: (v: string) => void; selectedDay: string; setSelectedDay: (v: string) => void;
  onSelectLesson: (item: ScheduleItem) => void; onClose: () => void;
}) {
  const subjectSchedule = useMemo(() => schedule.filter((item) => item.subjectId === subjectId), [schedule, subjectId]);

  const byDay = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    for (const item of subjectSchedule) { const key = String(item.dayOfWeek ?? 0); if (!map[key]) map[key] = []; map[key].push(item); }
    for (const key of Object.keys(map)) { map[key].sort((a, b) => a.lessonNumber - b.lessonNumber); }
    return map;
  }, [subjectSchedule]);

  const dayKeys = useMemo(() => Object.keys(byDay).sort((a, b) => Number(a) - Number(b)), [byDay]);

  useEffect(() => { if (dayKeys.length > 0 && !byDay[selectedDay]) { setSelectedDay(dayKeys[0]); } }, [dayKeys, selectedDay, byDay, setSelectedDay]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">Расписание: {subjectName}</h3>
            <p className="text-indigo-100 text-sm mt-0.5">Выберите урок из расписания</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="px-6 pt-4 pb-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide">Четверть</label>
          <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white text-gray-900 font-medium text-sm">
            <option value="1">I четверть</option>
            <option value="2">II четверть</option>
            <option value="3">III четверть</option>
            <option value="4">IV четверть</option>
          </select>
        </div>
        {dayKeys.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" clipRule="evenodd" /></svg>
              <p className="text-gray-500 font-medium">Нет уроков этого предмета в расписании</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 pt-2 pb-1">
              <div className="flex gap-1.5 flex-wrap">
                {dayKeys.map((dayNum) => (
                  <button key={dayNum} type="button" onClick={() => setSelectedDay(dayNum)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${selectedDay === dayNum ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    <span className="block text-xs opacity-70">{SHORT_DAYS[Number(dayNum)]}</span>
                    <span className="block">{DAYS_OF_WEEK_TRANSLATIONS[Number(dayNum)]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-3">
              {selectedDay && byDay[selectedDay] ? (
                <div className="space-y-2">
                  {byDay[selectedDay].map((item) => (
                    <button key={item.id} type="button" onClick={() => onSelectLesson(item)} className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group text-left">
                      <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0 group-hover:bg-indigo-200 transition-colors">{item.lessonNumber}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 tracking-wide">{item.subjectName}</p>
                        {item.teacherName && (<p className="text-sm text-gray-500 mt-0.5">{item.teacherName}</p>)}
                      </div>
                      {item.lessonDate && (<span className="text-sm text-gray-400 font-medium shrink-0">{new Date(item.lessonDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>)}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </button>
                  ))}
                </div>
              ) : (<div className="text-center py-8 text-gray-400">Выберите день недели</div>)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}