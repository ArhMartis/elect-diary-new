"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { saveDiarySettings } from "@/app/student/actions";

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

interface DiaryData {
  academicYear: string;
  surname: string;
  name: string;
  grade: string;
  schoolName: string;
  schoolAddress: string;
  subjects: { name: string; teacher: string }[];
  electives: { name: string; teacher: string; schedule: string }[];
  bellSchedule: { number: string; start: string; end: string; break: string }[];
  months: MonthData[];
  grades: { subject: string; q1: string; q2: string; q3: string; q4: string; year: string; exam: string; final: string }[];
  behavior: {
    q1: 'example' | 'satisfactory' | 'unsatisfactory' | '';
    q2: 'example' | 'satisfactory' | 'unsatisfactory' | '';
    q3: 'example' | 'satisfactory' | 'unsatisfactory' | '';
    q4: 'example' | 'satisfactory' | 'unsatisfactory' | '';
  };
  holidays: { autumn: string; winter: string; spring: string; summer: string };
  contacts: {
    director: string;
    directorPhone: string;
    vicePrincipal: string;
    vicePrincipalPhone: string;
    vicePrincipalEdu: string;
    vicePrincipalEduPhone: string;
    homeroomTeacher: string;
    homeroomTeacherPhone: string;
    psychologist: string;
    psychologistPhone: string;
    socialPedagogue: string;
    socialPedagoguePhone: string;
  };
}

interface MonthData {
  name: string;
  days: DayData[];
  absent: string;
  absentUnexcused: string;
}

interface DayData {
  date: string;
  lessons: LessonData[];
}

interface LessonData {
  subject: string;
  homework: string;
  grade: string;
}

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

interface StudentDiaryPageProps {
  studentId: string;
  studentFullName: string;
  studentGrade: string;
  studentGroupId: number | null;
  grades: Grade[];
  schedule: Lesson[];
  currentUserId?: string;
  isHomeroomTeacher?: boolean;
  isParent?: boolean;
  userRole?: string;
  initialDirectorName?: string;
  initialHomeroomTeacherName?: string;
  initialHomeroomTeacherPhone?: string;
  initialSchoolName?: string;
  initialSchoolAddress?: string;
  classSubjectNames?: string[];
  initialContacts?: {
    director: string;
    directorPhone: string;
    vicePrincipal: string;
    vicePrincipalPhone: string;
    vicePrincipalEdu: string;
    vicePrincipalEduPhone: string;
    homeroomTeacher: string;
    homeroomTeacherPhone: string;
    psychologist: string;
    psychologistPhone: string;
    socialPedagogue: string;
    socialPedagoguePhone: string;
  };
  initialHolidays?: {
    autumn: string;
    winter: string;
    spring: string;
    summer: string;
  };
  userAvatar?: string;
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const MONTHS = ["Сентябрь", "Октябрь", "Ноябрь", "Декабрь", "Январь", "Февраль", "Март", "Апрель", "Май"];

const HOLIDAYS_LIST = [
  { date: "1 января", name: "Новый год" },
  { date: "7 января", name: "Рождество Христово (Православное)" },
  { date: "8 марта", name: "День женщин" },
  { date: "1 мая", name: "Праздник труда" },
  { date: "9 мая", name: "День Победы" },
  { date: "3 июля", name: "День Независимости Республики Беларусь (День Республики)" },
  { date: "7 ноября", name: "День Октябрьской революции" },
  { date: "25 декабря", name: "Рождество Христово (Католическое)" },
];

const MEMORIAL_DATES = [
  { date: "2 февраля", name: "День памяти воинов-интернационалистов" },
  { date: "26 апреля", name: "День чернобыльской трагедии" },
  { date: "22 июня", name: "День всенародной памяти жертв Великой Отечественной войны" },
  { date: "14 августа", name: "День памяти защитников Отечества и воинов-интернационалистов" },
  { date: "1 ноября", name: "День поминовения усопших (Дзяды)" },
];

const PROFESSIONAL_HOLIDAYS = [
  { date: "15 мая", name: "День семьи" },
  { date: "1 июня", name: "День защиты детей" },
  { date: "28 июня", name: "День молодежи" },
  { date: "1 сентября", name: "День знаний" },
  { date: "5 октября", name: "День учителя" },
  { date: "14 ноября", name: "День социального работника" },
];

const DAYS_OF_WEEK = [
  { name: "Понедельник", short: "Пн", dayOfWeek: 1 },
  { name: "Вторник", short: "Вт", dayOfWeek: 2 },
  { name: "Среда", short: "Ср", dayOfWeek: 3 },
  { name: "Четверг", short: "Чт", dayOfWeek: 4 },
  { name: "Пятница", short: "Пт", dayOfWeek: 5 },
  { name: "Суббота", short: "Сб", dayOfWeek: 6 },
];

const DEFAULT_DATA: DiaryData = {
  academicYear: "", surname: "", name: "", grade: "", schoolName: "", schoolAddress: "",
  subjects: [], electives: [], bellSchedule: [],
  months: MONTHS.map(name => ({ name, days: Array(25).fill(null).map((_, i) => ({ date: "", lessons: Array(8).fill({ subject: "", homework: "", grade: "" }) })), absent: "", absentUnexcused: "" })),
  grades: [],
  behavior: { q1: '', q2: '', q3: '', q4: '' },
  holidays: { autumn: "", winter: "", spring: "", summer: "" },
  contacts: { director: "", directorPhone: "", vicePrincipal: "", vicePrincipalPhone: "", vicePrincipalEdu: "", vicePrincipalEduPhone: "", homeroomTeacher: "", homeroomTeacherPhone: "", psychologist: "", psychologistPhone: "", socialPedagogue: "", socialPedagoguePhone: "" },
};

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

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

function isDateInAcademicYear(date: Date): boolean {
  const year = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
  const start = new Date(year, 8, 1);
  const end = new Date(year + 1, 4, 31);
  return date >= start && date <= end;
}

function getQuarterNumber(date: Date): string {
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
  
  // Периоды четвертей (с учетом каникул):
  // 1 четверть: 1 сент - 27 окт (до осенних каникул)
  if (month === 9 || (month === 10 && day <= 27)) return '1';
  
  // 2 четверть: 4 нояб - 24 дек (после осенних каникул до зимних)
  if ((month === 11 && day >= 4) || (month === 12 && day <= 24)) return '2';
  
  // 3 четверть: 9 янв - 23 мар (после зимних каникул до весенних)
  if ((month === 1 && day >= 9) || month === 2 || (month === 3 && day <= 23)) return '3';
  
  // 4 четверть: 1 апр - 31 мая (после весенних каникул до конца учебного года)
  if ((month === 3 && day >= 31) || month === 4 || month === 5) return '4';
  
  return '1';
}

// Даты начала четвертей (после каникул)
const QUARTER_STARTS: Record<string, { month: number; day: number }> = {
  '1': { month: 8, day: 1 },   // 1 сентября
  '2': { month: 10, day: 4 },  // 4 ноября (после осенних каникул)
  '3': { month: 0, day: 9 },   // 9 января (после зимних каникул)
  '4': { month: 3, day: 1 },   // 1 апреля (после весенних каникул)
};

// Даты каникул
const HOLIDAY_PERIODS: Record<string, { startMonth: number; startDay: number; endMonth: number; endDay: number }> = {
  'autumn': { startMonth: 9, startDay: 28, endMonth: 10, endDay: 3 },  // 28 окт - 3 нояб
  'winter': { startMonth: 11, startDay: 25, endMonth: 0, endDay: 8 },   // 25 дек - 8 янв
  'spring': { startMonth: 2, startDay: 24, endMonth: 2, endDay: 30 },   // 24 мар - 30 мар
  'summer': { startMonth: 5, startDay: 1, endMonth: 7, endDay: 31 },    // 1 июн - 31 авг
};

function isDateInHolidays(date: Date, academicYear: string): boolean {
  const parts = academicYear.split('/');
  const startYear = parts[0] ? parseInt(parts[0]) : new Date().getFullYear();
  const year = date.getMonth() >= 8 ? startYear : startYear + 1;
  
  // Проверяем каждый период каникул
  for (const [key, period] of Object.entries(HOLIDAY_PERIODS)) {
    let startDate: Date;
    let endDate: Date;
    
    if (period.endMonth < period.startMonth) {
      // Каникулы переходят через Новый год (зимние)
      startDate = new Date(year - (date.getMonth() < 6 ? 1 : 0), period.startMonth, period.startDay);
      endDate = new Date(year, period.endMonth, period.endDay);
    } else {
      startDate = new Date(year, period.startMonth, period.startDay);
      endDate = new Date(year, period.endMonth, period.endDay);
    }
    
    if (date >= startDate && date <= endDate) {
      return true;
    }
  }
  
  return false;
}

function getQuarterStartDate(quarter: string, academicYear: string): Date {
  const parts = academicYear.split('/');
  const startYear = parts[0] ? parseInt(parts[0]) : new Date().getFullYear();
  const quarterStart = QUARTER_STARTS[quarter];
  
  if (!quarterStart) return new Date();
  
  // Для 3 и 4 четверти год следующий
  const year = quarter === '3' || quarter === '4' ? startYear + 1 : startYear;
  return new Date(year, quarterStart.month, quarterStart.day);
}

function getApproxStartOfWeekForQuarter(quarter: string, academicYear: string): Date {
  return getStartOfWeek(getQuarterStartDate(quarter, academicYear));
}

// Получить название каникул по дате
function getHolidayNameByDate(date: Date): string | null {
  const month = date.getMonth();
  const day = date.getDate();
  
  // Осенние каникулы: 28 окт - 3 нояб
  if ((month === 9 && day >= 28) || (month === 10 && day <= 3)) {
    return "🍂 Осенние каникулы";
  }
  // Зимние каникулы: 25 дек - 8 янв
  if ((month === 11 && day >= 25) || (month === 0 && day <= 8)) {
    return "❄️ Зимние каникулы";
  }
  // Весенние каникулы: 24 мар - 30 мар
  if (month === 2 && day >= 24 && day <= 30) {
    return "🌸 Весенние каникулы";
  }
  // Летние каникулы: 1 июн - 31 авг
  if (month >= 5 && month <= 7) {
    return "☀️ Летние каникулы";
  }
  
  return null;
}

// Получить праздник по дате
function getHolidayByDate(date: Date): string | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateStr = `${day} ${month === 1 ? 'января' : month === 2 ? 'февраля' : month === 3 ? 'марта' : month === 4 ? 'апреля' : month === 5 ? 'мая' : month === 6 ? 'июня' : month === 7 ? 'июля' : month === 8 ? 'августа' : month === 9 ? 'сентября' : month === 10 ? 'октября' : month === 11 ? 'ноября' : 'декабря'}`;
  
  // Проверяем государственные праздники
  for (const holiday of HOLIDAYS_LIST) {
    if (holiday.date === dateStr) {
      return `🎉 ${holiday.name}`;
    }
  }
  
  // Проверяем памятные даты
  for (const date of MEMORIAL_DATES) {
    if (date.date === dateStr) {
      return `🕯️ ${date.name}`;
    }
  }
  
  // Проверяем профессиональные праздники (только точные даты, не "последнее воскресенье")
  for (const holiday of PROFESSIONAL_HOLIDAYS) {
    if (holiday.date === dateStr) {
      return `💼 ${holiday.name}`;
    }
  }
  
  return null;
}

function getCurrentAcademicYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Если сейчас сентябрь-декабрь, учебный год текущий/следующий
  // Если январь-август, учебный год предыдущий/текущий
  if (currentMonth >= 8) {
    return `${currentYear}/${currentYear + 1}`;
  } else {
    return `${currentYear - 1}/${currentYear}`;
  }
}

// ============================================================================
// LOCALSTORAGE ФУНКЦИИ
// ============================================================================

function saveDiaryNoteLocal(studentId: string, weekStart: string, note: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`diary_note_${studentId}_${weekStart}`, note);
}

function getDiaryNoteLocal(studentId: string, weekStart: string): string {
  if (typeof window === 'undefined') return "";
  return localStorage.getItem(`diary_note_${studentId}_${weekStart}`) || "";
}

function verifyDiaryWeekLocal(teacherId: string, studentId: string, weekStart: string) {
  if (typeof window === 'undefined') return { success: false };
  localStorage.setItem(`diary_verification_${studentId}_${weekStart}`, JSON.stringify({ teacherId, verifiedAt: new Date().toISOString() }));
  return { success: true };
}

function getDiaryVerificationLocal(studentId: string, weekStart: string) {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(`diary_verification_${studentId}_${weekStart}`);
  if (data) {
    const parsed = JSON.parse(data);
    return { teacherId: parsed.teacherId, verifiedAt: new Date(parsed.verifiedAt) };
  }
  return null;
}

function verifyDiaryByParentLocal(parentId: string, studentId: string, weekStart: string) {
  if (typeof window === 'undefined') return { success: false };
  localStorage.setItem(`diary_parent_verification_${studentId}_${weekStart}`, JSON.stringify({ parentId, verifiedAt: new Date().toISOString() }));
  return { success: true };
}

function getParentVerificationLocal(studentId: string, weekStart: string) {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(`diary_parent_verification_${studentId}_${weekStart}`);
  if (data) {
    const parsed = JSON.parse(data);
    return { parentId: parsed.parentId, verifiedAt: new Date(parsed.verifiedAt) };
  }
  return null;
}

function getClassScheduleLocal(groupId: number): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(`diary_schedule_${groupId}`);
  return data ? JSON.parse(data) : {};
}

function saveClassScheduleLocal(groupId: number, schedule: Record<string, string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`diary_schedule_${groupId}`, JSON.stringify(schedule));
}

function getWeeklyAbsenceLocal(studentId: string): { absent: string; absentUnexcused: string } {
  if (typeof window === 'undefined') return { absent: "", absentUnexcused: "" };
  const data = localStorage.getItem(`diary_absence_${studentId}`);
  return data ? JSON.parse(data) : { absent: "", absentUnexcused: "" };
}

function saveWeeklyAbsenceLocal(studentId: string, absence: { absent: string; absentUnexcused: string }) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`diary_absence_${studentId}`, JSON.stringify(absence));
}

function getSubjectsFromStorage(): string[] {
  if (typeof window === 'undefined') return ["Математика", "Русский язык", "Белорусский язык", "Английский язык", "Физика", "Химия", "Биология", "История", "География", "Информатика", "Физкультура", "Музыка", "ИЗО"];
  const data = localStorage.getItem('subjects_list');
  return data ? JSON.parse(data) : ["Математика", "Русский язык", "Белорусский язык", "Английский язык", "Физика", "Химия", "Биология", "История", "География", "Информатика", "Физкультура", "Музыка", "ИЗО"];
}

function getDiaryDataLocal(studentId: string): Partial<DiaryData> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(`diary_data_${studentId}`);
  return data ? JSON.parse(data) : {};
}

function saveDiaryDataLocal(studentId: string, data: Partial<DiaryData>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`diary_data_${studentId}`, JSON.stringify(data));
}

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

export default function StudentDiaryPage({
  studentId,
  studentFullName,
  studentGrade,
  studentGroupId,
  grades,
  schedule,
  currentUserId,
  isHomeroomTeacher = false,
  isParent = false,
  userRole = "",
  initialDirectorName = "",
  initialHomeroomTeacherName = "",
  initialHomeroomTeacherPhone = "",
  initialSchoolName = "",
  initialSchoolAddress = "",
  classSubjectNames = [],
  initialContacts,
  initialHolidays,
  userAvatar = "",
}: StudentDiaryPageProps) {
  // Состояния
  const [data, setData] = useState<DiaryData>(DEFAULT_DATA);
  const [activeSection, setActiveSection] = useState<string>("week");
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Date>(getStartOfWeek(new Date()));
  const [studentNote, setStudentNote] = useState("");
  const [teacherVerification, setTeacherVerification] = useState<{ teacherId: string; verifiedAt: Date } | null>(null);
  const [parentVerification, setParentVerification] = useState<{ parentId: string; verifiedAt: Date } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isParentVerifying, setIsParentVerifying] = useState(false);
  
  const [sharedData, setSharedData] = useState({
    academicYear: getCurrentAcademicYear(),
    schoolName: initialSchoolName || "",
    schoolAddress: initialSchoolAddress || "",
    institution: initialSchoolName || "",
    director: initialDirectorName || initialContacts?.director || "",
    directorPhone: initialContacts?.directorPhone || "",
    vicePrincipal: initialContacts?.vicePrincipal || "",
    vicePrincipalPhone: initialContacts?.vicePrincipalPhone || "",
    vicePrincipalEdu: initialContacts?.vicePrincipalEdu || "",
    vicePrincipalEduPhone: initialContacts?.vicePrincipalEduPhone || "",
    homeroomTeacher: initialHomeroomTeacherName || initialContacts?.homeroomTeacher || "",
    homeroomTeacherPhone: initialHomeroomTeacherPhone || initialContacts?.homeroomTeacherPhone || "",
    psychologist: initialContacts?.psychologist || "",
    psychologistPhone: initialContacts?.psychologistPhone || "",
    socialPedagogue: initialContacts?.socialPedagogue || "",
    socialPedagoguePhone: initialContacts?.socialPedagoguePhone || "",
    holidays: initialHolidays || { autumn: "28.10 - 03.11", winter: "25.12 - 08.01", spring: "24.03 - 30.03", summer: "01.06 - 31.08" },
  });
  
  const [contacts, setContacts] = useState({
    director: initialDirectorName || initialContacts?.director || "",
    directorPhone: initialContacts?.directorPhone || "",
    vicePrincipal: initialContacts?.vicePrincipal || "",
    vicePrincipalPhone: initialContacts?.vicePrincipalPhone || "",
    vicePrincipalEdu: initialContacts?.vicePrincipalEdu || "",
    vicePrincipalEduPhone: initialContacts?.vicePrincipalEduPhone || "",
    homeroomTeacher: initialHomeroomTeacherName || initialContacts?.homeroomTeacher || "",
    homeroomTeacherPhone: initialHomeroomTeacherPhone || initialContacts?.homeroomTeacherPhone || "",
    psychologist: initialContacts?.psychologist || "",
    psychologistPhone: initialContacts?.psychologistPhone || "",
    socialPedagogue: initialContacts?.socialPedagogue || "",
    socialPedagoguePhone: initialContacts?.socialPedagoguePhone || "",
  });
  
  const [showNoClassModal, setShowNoClassModal] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<string>(() => getQuarterNumber(new Date()));
  const [scheduleData, setScheduleData] = useState<Record<string, string>>({});
  const [absence, setAbsence] = useState({ absent: "", absentUnexcused: "" });
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  // Модальное окно редактирования расписания
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Временный select для тестирования ролей
  const [tempUserRole, setTempUserRole] = useState<string>(userRole);

  // ============================================================================
  // ПРОВЕРКА РОЛЕЙ
  // ============================================================================

  const effectiveUserRole = tempUserRole || userRole;

  const canEditAbsence = useCallback(() => effectiveUserRole === "admin" || isHomeroomTeacher, [effectiveUserRole, isHomeroomTeacher]);
  const canEditSchedule = useCallback(() => effectiveUserRole === "admin", [effectiveUserRole]);
  const canEditInstitution = useCallback(() => effectiveUserRole === "admin", [effectiveUserRole]);
  const canEditContacts = useCallback(() => effectiveUserRole === "admin", [effectiveUserRole]);
  const canVerifyAsTeacher = useCallback(() => isHomeroomTeacher || effectiveUserRole === "admin" || effectiveUserRole === "teacher", [isHomeroomTeacher, effectiveUserRole]);
  const canVerifyAsParent = useCallback(() => isParent && teacherVerification !== null, [isParent, teacherVerification]);
  const isReadOnly = useCallback(() => effectiveUserRole === "student", [effectiveUserRole]);

  // ============================================================================
  // РАБОТА С РАСПИСАНИЕМ
  // ============================================================================

  const getScheduleForQuarter = useCallback((quarter: string): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(scheduleData).forEach(([key, value]) => {
      if (key.startsWith(`${quarter}-`)) {
        const parts = key.split('-');
        if (parts.length >= 3) {
          result[`${parts[1]}-${parts[2]}`] = value;
        }
      }
    });
    return result;
  }, [scheduleData]);

  const quarterSchedule = getScheduleForQuarter(selectedQuarter);

  const updateScheduleItem = (quarter: string, day: string, lessonNum: number, subject: string) => {
    if (!canEditSchedule()) return;
    const key = `${quarter}-${day}-${lessonNum}`;
    const newSchedule = { ...scheduleData };
    if (subject) {
      newSchedule[key] = subject;
    } else {
      delete newSchedule[key];
    }
    setScheduleData(newSchedule);
    if (studentGroupId) {
      saveClassScheduleLocal(studentGroupId, newSchedule);
    }
  };

  // ============================================================================
  // ЗАГРУЗКА ДАННЫХ
  // ============================================================================

  useEffect(() => {
    if (isLoaded && studentGrade === "") setShowNoClassModal(true);
  }, [isLoaded, studentGrade]);

  useEffect(() => {
    // Загрузка расписания
    if (studentGroupId) {
      const saved = getClassScheduleLocal(studentGroupId);
      setScheduleData(saved);
    }
    
    // Загрузка пропусков
    const savedAbsence = getWeeklyAbsenceLocal(studentId);
    setAbsence(savedAbsence);
    
    // Загрузка предметов - используем только фильтр предметов для класса
    setAvailableSubjects(classSubjectNames);
    
    // Загрузка данных дневника
    const savedData = getDiaryDataLocal(studentId);
    if (savedData && Object.keys(savedData).length > 0) {
      setData(prev => ({ ...prev, ...savedData }));
    } else {
      // Инициализация начальными данными
      setData(prev => ({
        ...prev,
        surname: studentFullName.split(" ")[0] || "",
        name: studentFullName.split(" ").slice(1).join(" ") || studentFullName,
        grade: studentGrade,
        academicYear: getCurrentAcademicYear(),
        subjects: schedule.reduce((acc: { name: string; teacher: string }[], lesson) => {
          if (lesson.subjectName && !acc.find(s => s.name === lesson.subjectName)) {
            acc.push({ name: lesson.subjectName, teacher: lesson.teacherName || "" });
          }
          return acc;
        }, []),
        holidays: { autumn: "28.10 - 03.11", winter: "25.12 - 08.01", spring: "24.03 - 30.03", summer: "01.06 - 31.08" },
      }));
    }
    
    setIsLoaded(true);
  }, [studentFullName, studentGrade, studentGroupId, studentId, schedule]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem("diary_shared_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSharedData(prev => {
          const merged = { ...prev };
          for (const [key, value] of Object.entries(parsed)) {
            if (value && typeof value === 'string' && !prev[key as keyof typeof prev]) {
              (merged as any)[key] = value;
            } else if (value && typeof value === 'string' && prev[key as keyof typeof prev]) {
              (merged as any)[key] = value;
            } else if (!prev[key as keyof typeof prev]) {
              (merged as any)[key] = value;
            }
          }
          return merged;
        });
        setContacts(prev => {
          const updated = { ...prev };
          for (const [key, value] of Object.entries(parsed)) {
            if (key in updated) {
              const val = value as string;
              if (val && !prev[key as keyof typeof prev]) {
                (updated as any)[key] = val;
              }
            }
          }
          return updated;
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    const weekStartStr = selectedWeek.toISOString().split("T")[0];
    const savedNote = getDiaryNoteLocal(studentId, weekStartStr);
    setStudentNote(savedNote);
    setTeacherVerification(getDiaryVerificationLocal(studentId, weekStartStr));
    setParentVerification(getParentVerificationLocal(studentId, weekStartStr));
  }, [selectedWeek, studentId]);

  // ============================================================================
  // ОБРАБОТЧИКИ
  // ============================================================================

  const handleSaveNote = () => {
    saveDiaryNoteLocal(studentId, selectedWeek.toISOString().split("T")[0], studentNote);
  };

  const handleVerify = () => {
    if (!currentUserId || isVerifying || !canVerifyAsTeacher()) return;
    setIsVerifying(true);
    const result = verifyDiaryWeekLocal(currentUserId, studentId, selectedWeek.toISOString().split("T")[0]);
    if (result.success) setTeacherVerification({ teacherId: currentUserId, verifiedAt: new Date() });
    setIsVerifying(false);
  };

  const handleParentVerify = () => {
    if (!currentUserId || isParentVerifying || !canVerifyAsParent()) return;
    setIsParentVerifying(true);
    const result = verifyDiaryByParentLocal(currentUserId, studentId, selectedWeek.toISOString().split("T")[0]);
    if (result.success) setParentVerification({ parentId: currentUserId, verifiedAt: new Date() });
    setIsParentVerifying(false);
  };

  const updateBehavior = (quarter: string, value: 'example' | 'satisfactory' | 'unsatisfactory' | '') => {
    if (isReadOnly()) return;
    const newData = { ...data, behavior: { ...data.behavior, [quarter]: value } };
    setData(newData);
    saveDiaryDataLocal(studentId, newData);
  };

  const updateContact = (field: keyof typeof contacts, value: string) => {
    if (!canEditContacts()) return;
    const updatedContacts = { ...contacts, [field]: value };
    setContacts(updatedContacts);
    const merged = { ...sharedData, ...updatedContacts };
    setSharedData(merged);
    localStorage.setItem("diary_shared_data", JSON.stringify(merged));
  };

  const updateSharedData = (field: keyof typeof sharedData, value: string) => {
    if (!canEditInstitution()) return;
    const updated = { ...sharedData, [field]: value };
    setSharedData(updated);
    localStorage.setItem("diary_shared_data", JSON.stringify(updated));
  };

  const updateAbsence = (field: 'absent' | 'absentUnexcused', value: string) => {
    if (!canEditAbsence()) return;
    const updated = { ...absence, [field]: value };
    setAbsence(updated);
    saveWeeklyAbsenceLocal(studentId, updated);
  };

  const handleSaveDiary = async () => {
    saveDiaryDataLocal(studentId, data);
    const merged = { ...sharedData, ...contacts };
    setSharedData(merged);
    localStorage.setItem("diary_shared_data", JSON.stringify(merged));
    if (canEditContacts() || canEditInstitution()) {
      await saveDiarySettings({
        schoolName: merged.schoolName || merged.institution,
        schoolAddress: merged.schoolAddress,
        director: merged.director,
        directorPhone: merged.directorPhone,
        vicePrincipal: merged.vicePrincipal,
        vicePrincipalPhone: merged.vicePrincipalPhone,
        vicePrincipalEdu: merged.vicePrincipalEdu,
        vicePrincipalEduPhone: merged.vicePrincipalEduPhone,
        homeroomTeacher: merged.homeroomTeacher,
        homeroomTeacherPhone: merged.homeroomTeacherPhone,
        psychologist: merged.psychologist,
        psychologistPhone: merged.psychologistPhone,
        socialPedagogue: merged.socialPedagogue,
        socialPedagoguePhone: merged.socialPedagoguePhone,
      });
    }
    alert("Дневник сохранен!");
  };

  const handlePrint = () => {
    window.print();
  };

  const navigateWeek = (direction: "prev" | "next") => {
    let newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === "prev" ? -7 : 7));
    
    // Проверяем границы учебного года
    if (!isDateInAcademicYear(newWeek)) {
      return; // Не выходим за границы учебного года
    }
    
    // Если попали на каникулы, пропускаем только ОДНУ неделю каникул
    if (isDateInHolidays(newWeek, sharedData.academicYear)) {
      // Пропускаем каникулы, переходя ещё на одну неделю в том же направлении
      newWeek.setDate(newWeek.getDate() + (direction === "prev" ? -7 : 7));
      
      // Если после пропуска каникул снова попали на каникулы (длинные каникулы),
      // пропускаем ещё одну неделю
      if (isDateInHolidays(newWeek, sharedData.academicYear)) {
        newWeek.setDate(newWeek.getDate() + (direction === "prev" ? -7 : 7));
      }
    }
    
    if (isDateInAcademicYear(newWeek)) {
      setSelectedWeek(getStartOfWeek(newWeek));
      setSelectedQuarter(getQuarterNumber(newWeek));
    }
  };

  // ============================================================================
  // ВЫЧИСЛЯЕМЫЕ ДАННЫЕ
  // ============================================================================

  const weekStart = selectedWeek;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 5);
  const currentMonth = (() => {
    const startMonth = selectedWeek.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    const endMonth = weekEnd.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    if (startMonth === endMonth) return startMonth;
    return `${startMonth} — ${endMonth}`;
  })();
  const weekNumber = getWeekNumber(selectedWeek);

  // Секции навигации (без месяцев для ученика и родителя)
  const baseSections = [
    { id: "week", label: "📅 Расписание" },
    { id: "title", label: "📝 Титульный" },
    { id: "contacts", label: "📞 Контакты" },
    { id: "subjects", label: "📚 Предметы" },
    { id: "grades", label: "📊 Аттестация" },
    { id: "holidays", label: "🏖️ Каникулы" },
    { id: "official", label: "🎉 Праздники" },
  ];

  const sections = (effectiveUserRole === "student" || effectiveUserRole === "parent")
    ? baseSections
    : [
        ...baseSections.slice(0, 4),
        ...MONTHS.map((m, i) => ({ id: `month-${i}`, label: m })),
        ...baseSections.slice(4),
      ];

  // ============================================================================
  // РЕНДЕРИНГ МОДАЛЬНЫХ ОКОН
  // ============================================================================

  const renderScheduleModal = () => {
    if (!showScheduleModal || !canEditSchedule()) return null;

    const topRowDays = DAYS_OF_WEEK.slice(0, 3);
    const bottomRowDays = DAYS_OF_WEEK.slice(3);

    return (
      <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-lg font-bold text-emerald-800">
                Редактирование расписания — {selectedQuarter} четверть
              </h2>
              {availableSubjects.length === 0 && (
                <p className="text-xs text-red-600 font-semibold mt-1">⚠️ Предметы в фильтре не назначены — выберите предметы для этого класса (Админ → Предметы → Фильтр по классу)</p>
              )}
            </div>
            <button
              onClick={() => setShowScheduleModal(false)}
              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Верхний ряд: Пн, Вт, Ср */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {topRowDays.map((day) => (
              <div key={day.name} className="border border-emerald-200 rounded-lg p-2 bg-gradient-to-b from-emerald-50/50 to-white">
                <h3 className="font-bold text-emerald-700 mb-2 text-center text-sm">{day.name}</h3>
                <div className="space-y-1">
                  {Array.from({ length: 8 }, (_, i) => i).map((lessonNum) => {
                    const key = `${selectedQuarter}-${day.name}-${lessonNum}`;
                    const value = scheduleData[key] || "";
                    return (
                      <div key={lessonNum} className="flex items-center gap-1">
                        <span className="text-xs font-medium text-emerald-600 w-7 bg-emerald-100 rounded px-1 py-0.5 text-center">{lessonNum + 1}</span>
                        <select
                          value={value}
                          onChange={(e) => updateScheduleItem(selectedQuarter, day.name, lessonNum, e.target.value)}
                          className="flex-1 text-xs border border-emerald-200 rounded px-1 py-1 focus:outline-none focus:border-emerald-500 bg-white text-emerald-800 font-semibold"
                        >
                          <option value="" className="text-gray-400">—</option>
                          {availableSubjects.map((subject) => (
                            <option key={subject} value={subject} className="text-emerald-900 font-semibold">{subject}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Нижний ряд: Чт, Пт, Сб */}
          <div className="grid grid-cols-3 gap-3">
            {bottomRowDays.map((day) => (
              <div key={day.name} className="border border-emerald-200 rounded-lg p-2 bg-gradient-to-b from-emerald-50/50 to-white">
                <h3 className="font-bold text-emerald-700 mb-2 text-center text-sm">{day.name}</h3>
                <div className="space-y-1">
                  {Array.from({ length: 8 }, (_, i) => i).map((lessonNum) => {
                    const key = `${selectedQuarter}-${day.name}-${lessonNum}`;
                    const value = scheduleData[key] || "";
                    return (
                      <div key={lessonNum} className="flex items-center gap-1">
                        <span className="text-xs font-medium text-emerald-600 w-7 bg-emerald-100 rounded px-1 py-0.5 text-center">{lessonNum + 1}</span>
                        <select
                          value={value}
                          onChange={(e) => updateScheduleItem(selectedQuarter, day.name, lessonNum, e.target.value)}
                          className="flex-1 text-xs border border-emerald-200 rounded px-1 py-1 focus:outline-none focus:border-emerald-500 bg-white text-emerald-800 font-semibold"
                        >
                          <option value="" className="text-gray-400">—</option>
                          {availableSubjects.map((subject) => (
                            <option key={subject} value={subject} className="text-emerald-900 font-semibold">{subject}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-center gap-2">
            <button
              onClick={() => setShowScheduleModal(false)}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm rounded-lg hover:from-emerald-600 hover:to-teal-600 font-medium transition-all"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // РЕНДЕРИНГ
  // ============================================================================

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-800 font-medium">Загрузка дневника...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 font-sans pt-16">
      {/* Модальное окно аватара */}
      {showAvatarModal && userAvatar && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative max-w-lg max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center text-white"
              onClick={() => setShowAvatarModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              src={userAvatar}
              alt="Avatar"
              width={400}
              height={400}
              className="rounded-2xl shadow-2xl object-cover"
            />
          </div>
        </div>
      )}

      {/* Модальное окно: ученик без класса */}
      {showNoClassModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-amber-300">
            <div className="text-6xl mb-2">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Вы не определили класс этого ученика!</h2>
            <p className="text-gray-600 mb-6">Назначьте класс через админ-панель или обратитесь к администрации.</p>
            <button onClick={() => window.history.back()} className="block w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-md">Назад</button>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования расписания */}
      {renderScheduleModal()}

      <div className="max-w-[210mm] mx-auto bg-white shadow-xl my-2 print:my-0 print:shadow-none rounded-xl overflow-hidden">
        {/* Навигация */}
        <div className="bg-white shadow-md border-b-2 border-emerald-300 px-4 py-4 mb-4">
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-3 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 #e5e7eb', WebkitOverflowScrolling: 'touch' }}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium text-sm flex-shrink-0 ${activeSection === section.id ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"}`}
                >
                  {section.label}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Шапка с профилем — после навигации */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200 px-4 py-3 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <a
                href="/diary"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all text-sm font-semibold"
              >
                Назад
              </a>
              <div
                className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-300 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => userAvatar && setShowAvatarModal(true)}
              >
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                    {studentFullName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-gray-800">{studentFullName}</p>
                <p className="text-sm text-gray-600">{studentGrade}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {effectiveUserRole === "admin" && (
                <a
                  href="/diary"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all text-sm font-semibold"
                >
                  🔄 Сменить класс и/или ученика
                </a>
              )}
              <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-3 py-2 border border-indigo-200">
                <span className="text-sm text-indigo-500">🎭</span>
                <select
                  value={tempUserRole}
                  onChange={(e) => setTempUserRole(e.target.value)}
                  className="text-sm border-0 bg-transparent text-violet-700 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="">{userRole || "Роль"}</option>
                  <option value="admin">👑 Админ</option>
                  <option value="teacher">👨‍🏫 Учитель</option>
                  <option value="homeroomTeacher">🍎 Классный</option>
                  <option value="parent">👨‍👩‍👧 Родитель</option>
                  <option value="student">🎒 Ученик</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Титульный лист */}
        {activeSection === "title" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-amber-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">🎓</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">Дневник учащегося</h2>
              <p className="text-gray-500 text-sm">официальный документ</p>
              {canEditInstitution() && <p className="text-xs text-emerald-600 mt-2">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса</p>}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-emerald-100">
              <h3 className="font-bold text-emerald-800 mb-6 flex items-center gap-2"><span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">📝</span>Основная информация</h3>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">Учебный год:</td>
                    <td className="py-4">
                      <input 
                        type="text" 
                        value={sharedData.academicYear} 
                        readOnly={!canEditInstitution()}
                        onChange={(e) => updateSharedData('academicYear', e.target.value)}
                        className={`w-full border-b-2 border-emerald-200 py-2 text-gray-800 font-bold ${canEditInstitution() ? 'bg-white' : 'bg-gray-50'}`} 
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">Фамилия:</td>
                    <td className="py-4">
                      <input type="text" value={data.surname} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50 font-bold" />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">Собственное имя:</td>
                    <td className="py-4">
                      <input type="text" value={data.name} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50 font-bold" />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">Класс:</td>
                    <td className="py-4">
                      <input type="text" value={data.grade} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50 font-bold" />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">
                      Наименование учреждения образования:
                      {canEditInstitution() && <span className="block text-xs text-emerald-600 font-normal mt-1">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса</span>}
                    </td>
                    <td className="py-4">
                      <input 
                        type="text" 
                        value={sharedData.institution || sharedData.schoolName} 
                        readOnly={!canEditInstitution()}
                        onChange={(e) => {
                          updateSharedData('schoolName', e.target.value);
                          updateSharedData('institution', e.target.value);
                        }}
                        className={`w-full border-b-2 border-emerald-200 py-2 text-gray-800 font-bold ${canEditInstitution() ? 'bg-white' : 'bg-gray-50'}`} 
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50 last:border-0">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">
                      Местонахождение учреждения образования:
                      {canEditInstitution() && <span className="block text-xs text-emerald-600 font-normal mt-1">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса</span>}
                    </td>
                    <td className="py-4">
                      <input 
                        type="text" 
                        value={sharedData.schoolAddress} 
                        readOnly={!canEditInstitution()}
                        onChange={(e) => updateSharedData('schoolAddress', e.target.value)}
                        className={`w-full border-b-2 border-emerald-200 py-2 text-gray-800 font-bold ${canEditInstitution() ? 'bg-white' : 'bg-gray-50'}`} 
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Контакты */}
        {activeSection === "contacts" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-violet-50/50 to-white">
            <div className="text-center mb-10"><div className="text-4xl mb-2">📞</div><h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Контактная информация</h2>
            {canEditContacts() && <p className="text-xs text-violet-500 mt-2">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-10 items-start">
              {[
                {label: "👔 Руководитель учреждения", field: "director" as const, phoneField: "directorPhone" as const, autoHint: true},
                {label: "🍎 Классный руководитель", field: "homeroomTeacher" as const, phoneField: "homeroomTeacherPhone" as const, isHomeroom: true},
                {label: "📚 Заместитель по учебной работе", field: "vicePrincipal" as const, phoneField: "vicePrincipalPhone" as const},
                {label: "🌟 Заместитель по воспитательной работе", field: "vicePrincipalEdu" as const, phoneField: "vicePrincipalEduPhone" as const},
                {label: "🧠 Педагог-психолог", field: "psychologist" as const, phoneField: "psychologistPhone" as const},
                {label: "🤝 Социальный педагог", field: "socialPedagogue" as const, phoneField: "socialPedagoguePhone" as const},
              ].map((contact, i) => (
                <div key={i} className="bg-white border border-violet-100 rounded-xl p-4 shadow-md">
                  <label className="block text-sm font-bold text-violet-700 mb-2">
                    {contact.label}
                    {canEditContacts() && contact.isHomeroom && (
                      <span className="block text-xs text-amber-600 font-normal mt-1">💡 Классный руководитель вставляется автоматически в зависимости от выбранного класса</span>
                    )}
                    {canEditContacts() && !contact.isHomeroom && (
                      <span className="block text-xs text-violet-500 font-normal mt-1">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="ФИО"
                    value={contacts[contact.field]}
                    readOnly={!canEditContacts()}
                    onChange={(e) => updateContact(contact.field, e.target.value)}
                    className={`w-full border-b-2 border-violet-200 py-2 text-gray-800 font-bold mb-2 ${canEditContacts() ? 'bg-white' : 'bg-gray-50'}`}
                  />
                  <input
                    type="tel"
                    placeholder="Телефон"
                    value={contacts[contact.phoneField]}
                    readOnly={!canEditContacts()}
                    onChange={(e) => updateContact(contact.phoneField, e.target.value)}
                    className={`w-full border-b-2 border-violet-200 py-2 text-gray-800 ${canEditContacts() ? 'bg-white' : 'bg-gray-50'}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Неделя / Расписание */}
        {activeSection === "week" && (
          <div className="p-4">
            {/* Заголовок с навигацией */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg mb-4">
              <div className="flex justify-between items-center">
                <button onClick={() => navigateWeek("prev")} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-bold">‹</button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold capitalize">{currentMonth}</h2>
                  <p className="text-sm opacity-90">Неделя {weekNumber} • {selectedQuarter === "1" ? "I" : selectedQuarter === "2" ? "II" : selectedQuarter === "3" ? "III" : selectedQuarter === "4" ? "IV" : ""} четверть</p>
                  <p className="text-xs opacity-75">{weekStart.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })} - {weekEnd.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}</p>
                </div>
                <button onClick={() => navigateWeek("next")} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-bold">›</button>
              </div>
            </div>

            {/* Выбор четверти + расписание */}
            <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-300">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-emerald-800 font-bold">
                  📚 {selectedQuarter} четверть ({selectedQuarter === "1" ? "сентябрь — ноябрь" : selectedQuarter === "2" ? "ноябрь — январь" : selectedQuarter === "3" ? "январь — апрель" : "апрель — июнь"})
                </p>
                <div className="flex gap-2">
                  {canEditSchedule() && (
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-bold transition-all"
                    >
                      ✏️ Изменить расписание
                    </button>
                  )}
                  <select 
                    value={selectedQuarter} 
                    onChange={e => { 
                      const q = e.target.value; 
                      setSelectedQuarter(q); 
                      setSelectedWeek(getApproxStartOfWeekForQuarter(q, sharedData.academicYear)); 
                    }} 
                    className="border-2 border-emerald-400 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none text-sm font-bold text-emerald-700 bg-white"
                  >
                    <option value="1">📚 1 четверть</option>
                    <option value="2">❄️ 2 четверть</option>
                    <option value="3">🌸 3 четверть</option>
                    <option value="4">☀️ 4 четверть</option>
                  </select>
                </div>
              </div>

              {/* Информация о каникулах всех четвертей */}
              <div className="mb-4 p-3 bg-gradient-to-r from-sky-100 to-blue-100 rounded-lg border-2 border-sky-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🏖️</span>
                  <span className="font-bold text-sky-800">Каникулы:</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="bg-white/70 px-3 py-2 rounded-lg">
                    <span className="font-semibold text-sky-700">🍂 Осенние:</span>{' '}
                    <span className="text-sky-900 font-medium">{sharedData.holidays?.autumn || "28.10 - 03.11"}</span>
                  </div>
                  <div className="bg-white/70 px-3 py-2 rounded-lg">
                    <span className="font-semibold text-sky-700">❄️ Зимние:</span>{' '}
                    <span className="text-sky-900 font-medium">{sharedData.holidays?.winter || "25.12 - 08.01"}</span>
                  </div>
                  <div className="bg-white/70 px-3 py-2 rounded-lg">
                    <span className="font-semibold text-sky-700">🌸 Весенние:</span>{' '}
                    <span className="text-sky-900 font-medium">{sharedData.holidays?.spring || "24.03 - 30.03"}</span>
                  </div>
                  <div className="bg-white/70 px-3 py-2 rounded-lg">
                    <span className="font-semibold text-sky-700">☀️ Летние:</span>{' '}
                    <span className="text-sky-900 font-medium">{sharedData.holidays?.summer || "01.06 - 31.08"}</span>
                  </div>
                </div>
              </div>

              {/* Расписание по дням */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {DAYS_OF_WEEK.map((day) => {
                  const dayLessons = Object.entries(quarterSchedule)
                    .filter(([key]) => key.startsWith(`${day.name}-`))
                    .map(([key, value]) => ({ 
                      lessonNumber: parseInt(key.split('-')[1]) + 1, 
                      subject: value as string 
                    }))
                    .sort((a, b) => a.lessonNumber - b.lessonNumber);
                  
                  // Вычисляем дату для этого дня
                  const dayDate = new Date(selectedWeek);
                  dayDate.setDate(dayDate.getDate() + (day.dayOfWeek - 1));
                  
                  // Проверяем каникулы и праздники
                  const holidayName = getHolidayNameByDate(dayDate);
                  const celebrationName = getHolidayByDate(dayDate);
                  const isHoliday = holidayName !== null;
                  
                  return (
                    <div key={day.name} className={`rounded-lg p-3 border-2 ${isHoliday ? 'bg-gradient-to-br from-sky-100 to-blue-100 border-sky-400' : 'bg-white border-emerald-200'}`}>
                      <h4 className={`font-bold text-sm mb-2 ${isHoliday ? 'text-sky-900' : 'text-emerald-900'}`}>
                        {day.name}
                        <span className="block text-xs font-normal opacity-75 mt-1">
                          {dayDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </h4>
                      
                      {/* Отображение каникул */}
                      {holidayName && (
                        <div className="mb-2 p-2 bg-white/70 rounded-lg">
                          <span className="text-xs font-bold text-sky-700 block">{holidayName}</span>
                          <span className="text-xs text-sky-600">Каникулы!</span>
                        </div>
                      )}
                      
                      {/* Отображение праздника */}
                      {celebrationName && !isHoliday && (
                        <div className="mb-2 p-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border border-amber-300">
                          <span className="text-xs font-bold text-amber-800 block">{celebrationName}</span>
                        </div>
                      )}
                      
                      {!isHoliday && (dayLessons.length === 0 ? 
                        <p className="text-xs text-gray-400 italic">Нет уроков</p> : (
                        <div className="space-y-1">
                          {dayLessons.map(lesson => (
                            <div key={lesson.lessonNumber} className="flex items-center gap-2 p-1.5 bg-emerald-50 rounded">
                              <span className="w-5 h-5 flex items-center justify-center bg-emerald-200 text-emerald-800 rounded-full text-xs font-bold">{lesson.lessonNumber}</span>
                              <span className="text-xs font-bold text-gray-800 truncate">{lesson.subject}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Пропуски - упрощенная форма */}
            {canEditAbsence() && (
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Пропуски учебных занятий
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Количество пропущенных учебных занятий
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={absence.absent}
                      onChange={(e) => updateAbsence('absent', e.target.value)}
                      className="w-full border-2 border-orange-300 rounded-lg px-3 py-2 text-center text-lg font-bold text-orange-700 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      в том числе по неуважительным причинам
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={absence.absentUnexcused}
                      onChange={(e) => updateAbsence('absentUnexcused', e.target.value)}
                      className="w-full border-2 border-red-300 rounded-lg px-3 py-2 text-center text-lg font-bold text-red-700 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Заметки */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <label className="text-lg font-bold text-gray-800">Заметки ученика</label>
              </div>
              <textarea 
                value={studentNote} 
                onChange={e => { setStudentNote(e.target.value); handleSaveNote(); }} 
                placeholder="Личные заметки..." 
                readOnly={isReadOnly()}
                className={`w-full h-32 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-400 resize-none ${isReadOnly() ? 'bg-gray-50' : 'bg-white'}`} 
              />
            </div>

            {/* Верификация */}
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 mt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <label className="text-lg font-bold text-gray-800">Просмотр дневника</label>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {teacherVerification ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">Классный руководитель просмотрел</p>
                            <p className="text-xs text-gray-500">{new Date(teacherVerification.verifiedAt).toLocaleDateString("ru-RU")}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 text-sm">Классный руководитель не просмотрел</p>
                          </div>
                        </>
                      )}
                    </div>
                    {canVerifyAsTeacher() && currentUserId && !teacherVerification && (
                      <button 
                        onClick={handleVerify} 
                        disabled={isVerifying} 
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700 transition-all flex-shrink-0"
                      >
                        {isVerifying ? "..." : "Просмотреть"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {parentVerification ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-sm">Родитель просмотрел</p>
                            <p className="text-xs text-gray-500">{new Date(parentVerification.verifiedAt).toLocaleDateString("ru-RU")}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <div>
                            <p className="font-bold text-gray-700 text-sm">Родитель не просмотрел</p>
                            {isParent && !teacherVerification && (
                              <p className="text-xs text-amber-600">Сначала должен просмотреть классный руководитель</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {isParent && currentUserId && !parentVerification && canVerifyAsParent() && (
                      <button 
                        onClick={handleParentVerify} 
                        disabled={isParentVerifying} 
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700 transition-all flex-shrink-0"
                      >
                        {isParentVerifying ? "..." : "Просмотреть"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Предметы */}
        {activeSection === "subjects" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-emerald-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">📚</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Учебные предметы и учителя</h2>
              {canEditInstitution() && <p className="text-xs text-emerald-600 mt-2">💡 Предметы указываются в фильтре предметов для классов (Админ → Предметы → Фильтр по классу)</p>}
            </div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-10 border border-emerald-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    <th className="border border-emerald-400 p-4 font-bold w-1/2">📖 Учебный предмет</th>
                    <th className="border border-emerald-400 p-4 font-bold w-1/2">👨‍🏫 Учитель (ФИО)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjects.length > 0 ? data.subjects.map((subject, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-emerald-50"}>
                      <td className="border border-emerald-200 p-3">
                        <span className="text-gray-800 font-bold">{subject.name}</span>
                      </td>
                      <td className="border border-emerald-200 p-3">
                        <span className="text-gray-800 font-bold">{subject.teacher || "—"}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={2} className="border border-emerald-200 p-8 text-center text-gray-700 font-bold">
                        Предметы не назначены. Обратитесь к администратору.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Месяцы */}
        {activeSection.startsWith("month-") && (
          <div className="min-h-[297mm] p-8">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-green-800">Месяц:</h2>
              <input 
                type="text" 
                value={data.months[parseInt(activeSection.split("-")[1])]?.name || ""} 
                readOnly 
                className="text-2xl font-bold border-b-2 border-green-800 focus:outline-none w-48 bg-transparent" 
              />
            </div>
          </div>
        )}

        {/* Аттестация */}
        {activeSection === "grades" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-rose-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">📊</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">Сведения о результатах аттестации</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-lg mb-8 border border-rose-100">
              <table className="w-full text-xs table-fixed">
                <thead>
                  <tr className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-t-2xl">
                    <th className="border border-rose-400 px-2 py-2 text-left font-bold w-[35%]">📖 Учебный предмет</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold">I</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold">II</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold">III</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold">IV</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold bg-rose-600/50">Годовая</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold bg-rose-600/50">Экзамен</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold bg-rose-600/30">Итоговая</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjects.length > 0 ? data.subjects.map((subj, i) => {
                    const grade = data.grades.find(g => g.subject === subj.name);
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-rose-50"}>
                        <td className="border border-rose-200 px-2 py-1.5">
                          <span className="text-gray-800 font-bold">{subj.name}</span>
                        </td>
                        {["q1", "q2", "q3", "q4", "year", "exam", "final"].map((field) => (
                          <td key={field} className="border border-rose-200 px-1 py-1.5 text-center">
                            <span className="font-bold text-gray-800">{grade?.[field as keyof typeof grade] || "—"}</span>
                          </td>
                        ))}
                      </tr>
                    );
                  }) : data.grades.length > 0 ? data.grades.map((grade, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-rose-50"}>
                      <td className="border border-rose-200 px-2 py-1.5">
                        <span className="text-gray-800 font-bold">{grade.subject}</span>
                      </td>
                      {["q1", "q2", "q3", "q4", "year", "exam", "final"].map((field) => (
                        <td key={field} className="border border-rose-200 px-1 py-1.5 text-center">
                          <span className="font-bold text-gray-800">{grade[field as keyof typeof grade] || "—"}</span>
                        </td>
                      ))}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="border border-rose-200 p-8 text-center text-gray-700 font-bold">
                        Вы не выбрали для &quot;{studentGrade || "класса"}&quot; перечень предметов в фильтре (Админ → Предметы → Фильтр по классу)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg p-6 border-2 border-emerald-300">
              <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>Поведение по четвертям
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q, i) => (
                  <div key={q} className="bg-white rounded-xl p-4 border-2 border-emerald-200">
                    <h4 className="font-bold text-emerald-800 mb-3 text-center text-sm">{i + 1} четв.</h4>
                    <div className="space-y-1 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`behavior-${q}`} 
                          checked={data.behavior[q] === 'example'} 
                          onChange={() => updateBehavior(q, 'example')} 
                          className="w-3 h-3 text-emerald-600" 
                        />
                        <span className="text-gray-700 font-bold">Примерное</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`behavior-${q}`} 
                          checked={data.behavior[q] === 'satisfactory'} 
                          onChange={() => updateBehavior(q, 'satisfactory')} 
                          className="w-3 h-3 text-emerald-600" 
                        />
                        <span className="text-gray-700 font-bold">Удовлет.</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="radio" 
                          name={`behavior-${q}`} 
                          checked={data.behavior[q] === 'unsatisfactory'} 
                          onChange={() => updateBehavior(q, 'unsatisfactory')} 
                          className="w-3 h-3 text-emerald-600" 
                        />
                        <span className="text-gray-700 font-bold">Неудовл.</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Каникулы */}
        {activeSection === "holidays" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-sky-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">🏖️</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600">Каникулы</h2>
              {canEditInstitution() && (
                <p className="text-sm text-sky-600 mt-2">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса. Они будут идентичны только для одних и тех же классов (5-А, 5-Г например, для 8-А 8-Б другие каникулы и так далее)</p>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                {label: "🍂 Осенние каникулы", key: "autumn" as const},
                {label: "❄️ Зимние каникулы", key: "winter" as const},
                {label: "🌸 Весенние каникулы", key: "spring" as const},
                {label: "☀️ Летние каникулы", key: "summer" as const},
              ].map((item, i) => (
                <div key={i} className="bg-gradient-to-br from-white to-sky-50 rounded-2xl shadow-lg p-6 border-2 border-sky-200">
                  <label className="block text-lg font-bold text-sky-800 mb-3">{item.label}</label>
                  {canEditInstitution() ? (
                    <input
                      type="text"
                      value={sharedData.holidays[item.key]}
                      onChange={(e) => {
                        const updated = { ...sharedData, holidays: { ...sharedData.holidays, [item.key]: e.target.value } };
                        setSharedData(updated);
                        localStorage.setItem("diary_shared_data", JSON.stringify(updated));
                      }}
                      placeholder="Например: 28.10 - 03.11"
                      className="w-full border-2 border-sky-200 rounded-lg px-4 py-2 text-gray-800 font-bold bg-white focus:outline-none focus:border-sky-500"
                    />
                  ) : (
                    <p className="text-gray-800 text-lg font-bold">{sharedData.holidays[item.key] || "Не указаны"}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Праздники */}
        {activeSection === "official" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-indigo-50/50 to-white">
            <div className="text-center mb-10">
              <p className="text-5xl font-black mb-4">
                <span className="text-red-600">B</span><span className="text-emerald-600">Y</span>
              </p>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                Государственные праздники и памятные даты
              </h2>
              <p className="text-gray-500 mt-2 italic">
                Республики Беларусь
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🎉</span>
                  <h3 className="text-xl font-bold text-red-800">Государственные праздники</h3>
                </div>
                <ul className="space-y-3">
                  {HOLIDAYS_LIST.map((holiday, i) => (
                    <li key={i} className="flex gap-3 items-start bg-white rounded-lg p-3 shadow-sm">
                      <span className="flex-shrink-0 w-24 font-bold text-red-600">{holiday.date}</span>
                      <span className="text-gray-800 font-bold">{holiday.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl shadow-lg p-6 border-2 border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🕯️</span>
                  <h3 className="text-xl font-bold text-gray-800">Памятные даты</h3>
                </div>
                <ul className="space-y-3">
                  {MEMORIAL_DATES.map((date, i) => (
                    <li key={i} className="flex gap-2 items-start bg-white rounded-lg p-3 shadow-sm overflow-hidden">
                      <span className="flex-shrink-0 w-16 sm:w-20 font-bold text-gray-600 text-xs sm:text-sm">{date.date}</span>
                      <span className="text-gray-800 font-bold text-xs sm:text-sm break-words flex-1 min-w-0 leading-snug">{date.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg p-6 border border-emerald-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">💼</span>
                <h3 className="text-xl font-bold text-emerald-800">Профессиональные праздники</h3>
              </div>
              <ul className="space-y-3">
                {PROFESSIONAL_HOLIDAYS.map((holiday, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white rounded-lg p-3 shadow-sm">
                    <span className="flex-shrink-0 w-48 font-bold text-emerald-600">{holiday.date}</span>
                    <span className="text-gray-800 font-bold">{holiday.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Кнопки сохранения и печати */}
        <div className="-mt-6 p-4 bg-gray-50 border-t-2 border-gray-200 print:hidden">
          <div className="flex justify-center gap-4">
            <button
              onClick={handleSaveDiary}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Сохранить дневник
            </button>
            <button
              onClick={handlePrint}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Печать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
