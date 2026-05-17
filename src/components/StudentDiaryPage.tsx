"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from "react";
import Image from "next/image";
import { saveDiarySettings } from "@/app/student/actions";
import { CallyCalendar } from "./CallyCalendar";

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
  subjects: { name: string; teacher: string; gradeType?: 'numeric' | 'passfail' }[];
  electives: { name: string; teacher: string; schedule: string }[];
  bellSchedule: { number: string; start: string; end: string; break: string }[];
  months: MonthData[];
  grades: { subject: string; q1: string; q2: string; q3: string; q4: string; year: string; exam: string; final: string; gradeType?: 'numeric' | 'passfail' }[];
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
  quarter?: number | null;
}

interface StudentDiaryPageProps {
  studentId: string;
  studentFullName: string;
  studentGrade: string;
  studentGroupId: number | null;
  grades: Grade[];
  schedule: Lesson[];
  currentUserId?: string;
  currentUserName?: string;
  isHomeroomTeacher?: boolean;
  isParent?: boolean;
  userRole?: string;
  initialDirectorName?: string;
  initialHomeroomTeacherName?: string | null;
  initialHomeroomTeacherPhone?: string | null;
  initialSchoolName?: string;
  initialSchoolAddress?: string;
  classSubjectNames?: string[];
  scheduleSubjectNames?: string[];
  subjectTeacherMap?: Record<string, string>;
  eventSubjectNames?: string[];
  specialSubjectNames?: string[];
  initialContacts?: {
    director: string;
    directorPhone: string;
    vicePrincipal: string;
    vicePrincipalPhone: string;
    vicePrincipalEdu: string;
    vicePrincipalEduPhone: string;
    homeroomTeacher: string | null;
    homeroomTeacherPhone: string | null;
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

function getHolidayYear(date: Date, academicYear: string): number {
  const parts = academicYear.split('/');
  const startYear = parts[0] ? parseInt(parts[0]) : new Date().getFullYear();
  return date.getMonth() >= 8 ? startYear : startYear + 1;
}

function getHolidayPeriodForDate(date: Date, academicYear: string): { start: Date; end: Date } | null {
  const year = getHolidayYear(date, academicYear);

  for (const period of Object.values(HOLIDAY_PERIODS)) {
    let startDate: Date;
    let endDate: Date;

    if (period.endMonth < period.startMonth) {
      startDate = new Date(year - (date.getMonth() < 6 ? 1 : 0), period.startMonth, period.startDay);
      endDate = new Date(year, period.endMonth, period.endDay);
    } else {
      startDate = new Date(year, period.startMonth, period.startDay);
      endDate = new Date(year, period.endMonth, period.endDay);
    }

    if (date >= startDate && date <= endDate) {
      return { start: startDate, end: endDate };
    }
  }

  return null;
}

function isDateInHolidays(date: Date, academicYear: string): boolean {
  return getHolidayPeriodForDate(date, academicYear) !== null;
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
function getHolidayByDate(date: Date, disabledHolidays: Set<string> = new Set()): { name: string; key: string } | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateStr = `${day} ${month === 1 ? 'января' : month === 2 ? 'февраля' : month === 3 ? 'марта' : month === 4 ? 'апреля' : month === 5 ? 'мая' : month === 6 ? 'июня' : month === 7 ? 'июля' : month === 8 ? 'августа' : month === 9 ? 'сентября' : month === 10 ? 'октября' : month === 11 ? 'ноября' : 'декабря'}`;

  // Проверяем государственные праздники
  for (const holiday of HOLIDAYS_LIST) {
    if (holiday.date === dateStr) {
      const key = `state-${holiday.date}`;
      if (disabledHolidays.has(key)) return null;
      return { name: `🎉 ${holiday.name}`, key };
    }
  }

  // Проверяем памятные даты
  for (const date of MEMORIAL_DATES) {
    if (date.date === dateStr) {
      const key = `memorial-${date.date}`;
      if (disabledHolidays.has(key)) return null;
      return { name: `🕯️ ${date.name}`, key };
    }
  }

  // Проверяем профессиональные праздники (только точные даты, не "последнее воскресенье")
  for (const holiday of PROFESSIONAL_HOLIDAYS) {
    if (holiday.date === dateStr) {
      const key = `professional-${holiday.date}`;
      if (disabledHolidays.has(key)) return null;
      return { name: `💼 ${holiday.name}`, key };
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

async function saveClassScheduleServer(groupId: number, schedule: Record<string, string>) {
  try {
    await fetch('/api/schedule/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId, scheduleData: schedule }),
    });
  } catch {}
}

function saveClassScheduleLocal(groupId: number, schedule: Record<string, string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`diary_schedule_${groupId}`, JSON.stringify(schedule));
  saveClassScheduleServer(groupId, schedule);
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
// КОМПОНЕНТ КАЛЕНДАРЯ КАНИКУЛ (Cally Calendar)
// ============================================================================

interface HolidayCalendarSectionProps {
  sharedData: {
    holidays: { autumn: string; winter: string; spring: string; summer: string };
    academicYear: string;
  };
  setSharedData: (data: any) => void;
  canEdit: boolean;
}

function HolidayCalendarSection({ sharedData, setSharedData, canEdit }: HolidayCalendarSectionProps) {
  const [selectedDates, setSelectedDates] = useState<{[key: string]: {start: string; end: string}}>({
    autumn: { start: "", end: "" },
    winter: { start: "", end: "" },
    spring: { start: "", end: "" },
    summer: { start: "", end: "" },
  });

  // Parse existing holiday values
  useEffect(() => {
    const parseDates = (value: string) => {
      if (!value) return { start: "", end: "" };
      // Формат "DD.MM.YYYY - DD.MM.YYYY"
      const matchDot = value.match(/(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/);
      if (matchDot) {
        return {
          start: `${matchDot[3]}-${matchDot[2]}-${matchDot[1]}`,
          end: `${matchDot[6]}-${matchDot[5]}-${matchDot[4]}`
        };
      }
      // Формат "YYYY-MM-DD - YYYY-MM-DD" (из БД)
      const matchDash = value.match(/(\d{4})-(\d{2})-(\d{2})\s*-\s*(\d{4})-(\d{2})-(\d{2})/);
      if (matchDash) {
        return {
          start: `${matchDash[1]}-${matchDash[2]}-${matchDash[3]}`,
          end: `${matchDash[4]}-${matchDash[5]}-${matchDash[6]}`
        };
      }
      return { start: "", end: "" };
    };

    setSelectedDates({
      autumn: parseDates(sharedData.holidays.autumn),
      winter: parseDates(sharedData.holidays.winter),
      spring: parseDates(sharedData.holidays.spring),
      summer: parseDates(sharedData.holidays.summer),
    });
  }, [sharedData.holidays]);

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}.${match[2]}.${match[1]}`;
    }
    return dateStr;
  };

  const updateHoliday = (period: string, start: string, end: string) => {
    if (start && end) {
      const value = `${formatDateForDisplay(start)} - ${formatDateForDisplay(end)}`;
      const updated = { 
        ...sharedData, 
        holidays: { ...sharedData.holidays, [period]: value } 
      };
      setSharedData(updated);
      localStorage.setItem("diary_shared_data", JSON.stringify(updated));
    }
  };

  const holidayConfigs = [
    { key: "autumn", label: "🍂 Осенние каникулы", color: "bg-amber-100", borderColor: "border-amber-300", textColor: "text-amber-800" },
    { key: "winter", label: "❄️ Зимние каникулы", color: "bg-blue-100", borderColor: "border-blue-300", textColor: "text-blue-800" },
    { key: "spring", label: "🌸 Весенние каникулы", color: "bg-pink-100", borderColor: "border-pink-300", textColor: "text-pink-800" },
    { key: "summer", label: "☀️ Летние каникулы", color: "bg-yellow-100", borderColor: "border-yellow-300", textColor: "text-yellow-800" },
  ];

  const CallyCalendarDropdown = ({ 
    period, 
    type, 
    currentDate
  }: { 
    period: string; 
    type: 'start' | 'end'; 
    currentDate: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 0 });

    const handleDateChange = (value: string) => {
      if (value) {
        const newDates = { ...selectedDates };
        newDates[period][type] = value;
        setSelectedDates(newDates);
        updateHoliday(period, newDates[period].start, newDates[period].end);
        setIsOpen(false);
      }
    };

    // Compute position when opening (flip upwards if overflows bottom)
    useLayoutEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const popoverHeight = 320; // approximate calendar height
        const gap = 8;
        const viewportH = window.innerHeight;
        const viewportW = window.innerWidth;

        let top = rect.bottom + gap;
        // Flip to top if not enough space below
        if (top + popoverHeight > viewportH - gap) {
          top = rect.top - popoverHeight - gap;
          if (top < gap) top = gap; // fallback: stick to top
        }

        let left = rect.left;
        const popoverWidth = Math.max(rect.width, 280);
        // Keep inside right edge
        if (left + popoverWidth > viewportW - gap) {
          left = viewportW - popoverWidth - gap;
          if (left < gap) left = gap;
        }

        setPopoverPos({ top, left, width: rect.width });
      }
    }, [isOpen]);

    // Close popover when clicking outside or on escape
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
            buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
        };
      }
    }, [isOpen]);

    // Compute academic year bounds
    const getYearBounds = () => {
      const match = sharedData.academicYear.match(/(\d{4})\/(\d{4})/);
      if (match) {
        const startYear = parseInt(match[1]);
        const endYear = parseInt(match[2]);
        return {
          min: `${startYear}-09-01`,
          max: `${endYear}-08-31`,
        };
      }
      return { min: undefined, max: undefined };
    };

    const yearBounds = getYearBounds();

    return (
      <div className="w-full relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-left font-bold text-gray-900 hover:border-sky-500 transition-colors flex justify-between items-center"
        >
          <span>{currentDate ? formatDateForDisplay(currentDate) : "Выберите дату"}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </button>
        
        {isOpen && (
          <div
            ref={popoverRef}
            className="fixed z-[9999] rounded-xl shadow-2xl border border-gray-200 p-3 bg-white"
            style={{ 
              top: popoverPos.top,
              left: popoverPos.left,
              width: Math.max(popoverPos.width, 280),
              maxWidth: 'calc(100vw - 16px)',
            }}
          >
            <CallyCalendar 
              key={`${period}-${type}-${currentDate}-${yearBounds.min}-${yearBounds.max}`}
              value={currentDate}
              onChange={handleDateChange}
              min={yearBounds.min}
              max={yearBounds.max}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 md:p-8 bg-gradient-to-b from-sky-50/50 to-white">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">🏖️</div>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600">Каникулы</h2>
        <p className="text-sm text-gray-600 mt-2">Учебный год: {sharedData.academicYear}</p>
        {canEdit && (
          <p className="text-sm text-sky-600 mt-2">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса</p>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {holidayConfigs.map((item) => (
            <div key={item.key} className={`${item.color} rounded-2xl shadow-lg p-5 border-2 ${item.borderColor}`}>
              <label className={`block text-lg font-bold ${item.textColor} mb-3`}>{item.label}</label>
              {canEdit ? (
                <div className="space-y-3">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Начало периода:</label>
                    <CallyCalendarDropdown
                      period={item.key}
                      type="start"
                      currentDate={selectedDates[item.key].start}
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Конец периода (включительно):</label>
                    <CallyCalendarDropdown
                      period={item.key}
                      type="end"
                      currentDate={selectedDates[item.key].end}
                    />
                  </div>

                  {/* Preview */}
                  {selectedDates[item.key].start && selectedDates[item.key].end && (
                    <div className="mt-2 p-2 bg-white/70 rounded-lg">
                      <p className="text-sm font-bold text-gray-800">
                        {formatDateForDisplay(selectedDates[item.key].start)} — {formatDateForDisplay(selectedDates[item.key].end)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-800 text-lg font-bold">{sharedData.holidays[item.key as keyof typeof sharedData.holidays] || "Не указаны"}</p>
              )}
            </div>
        ))}
      </div>
    </div>
  );
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
  currentUserName = "",
  isHomeroomTeacher = false,
  isParent = false,
  userRole = "",
  initialDirectorName = "",
  initialHomeroomTeacherName = "",
  initialHomeroomTeacherPhone = "",
  initialSchoolName = "",
  initialSchoolAddress = "",
  classSubjectNames = [],
  scheduleSubjectNames = [],
  subjectTeacherMap = {},
  eventSubjectNames = [],
  specialSubjectNames = [],
  initialContacts,
  initialHolidays,
  userAvatar = "",
}: StudentDiaryPageProps) {
  // Состояния
  const [data, setData] = useState<DiaryData>(DEFAULT_DATA);
  const [activeSection, setActiveSection] = useState<string>("week");
  const [quarterConfirmations, setQuarterConfirmations] = useState<Record<string, { confirmedByTeacher: string | null; confirmedByTeacherAt: string | null; confirmedByParent: string | null; confirmedByParentAt: string | null }>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<Date>(getStartOfWeek(new Date()));
  const [viewMonthIdx, setViewMonthIdx] = useState<number>(() => {
    const m = new Date().getMonth();
    const map: Record<number, number> = { 8:0, 9:1, 10:2, 11:3, 0:4, 1:5, 2:6, 3:7, 4:8 };
    return map[m] ?? 0;
  });
  const prevGroupIdRef = useRef<number | null>(null);
  const [studentNote, setStudentNote] = useState("");
  const [teacherVerification, setTeacherVerification] = useState<{ teacherId: string; verifiedAt: Date } | null>(null);
  const [parentVerification, setParentVerification] = useState<{ parentId: string; verifiedAt: Date } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isParentVerifying, setIsParentVerifying] = useState(false);
  const [comments, setComments] = useState<{id: number; teacherId: string; teacherName: string | null; comment: string; date: number}[]>([]);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [showConfirmComment, setShowConfirmComment] = useState(false);
  const [showConfirmClearComments, setShowConfirmClearComments] = useState(false);
  const [clearingComments, setClearingComments] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const commentsPerPage = 5;
  const [editingCell, setEditingCell] = useState<{ subjectIdx: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const handleCellEdit = async (subjectIdx: number, field: string, value: string) => {
    const subj = data.subjects[subjectIdx];
    if (!subj) return;
    const academicYear = data.academicYear || getCurrentAcademicYear();
    const payload: Record<string, any> = {
      studentId,
      subjectName: subj.name,
      academicYear,
    };
    const grade = data.grades.find(g => g.subject === subj.name);
    if (grade) {
      payload.q1 = field === "q1" ? value : grade.q1 || '';
      payload.q2 = field === "q2" ? value : grade.q2 || '';
      payload.q3 = field === "q3" ? value : grade.q3 || '';
      payload.q4 = field === "q4" ? value : grade.q4 || '';
      payload.year = field === "year" ? value : grade.year || '';
      payload.exam = field === "exam" ? value : grade.exam || '';
      payload.final = field === "final" ? value : grade.final || '';
      payload.gradeType = subj.gradeType || grade.gradeType || 'numeric';
    } else {
      payload[field] = value;
      payload.gradeType = subj.gradeType || 'numeric';
    }
    try {
      await fetch('/api/final-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setData((prev: DiaryData) => {
        const existingGrade = prev.grades.find(g => g.subject === subj.name);
        let newGrades: DiaryData['grades'];
        if (existingGrade) {
          newGrades = prev.grades.map(g => {
            if (g.subject !== subj.name) return g;
            return { ...g, [field]: value } as DiaryData['grades'][number];
          });
        } else {
          const newGrade = { subject: subj.name, q1: field === "q1" ? value : '', q2: field === "q2" ? value : '', q3: field === "q3" ? value : '', q4: field === "q4" ? value : '', year: field === "year" ? value : '', exam: field === "exam" ? value : '', final: field === "final" ? value : '', gradeType: (subj.gradeType || 'numeric') as 'numeric' | 'passfail' };
          newGrades = [...prev.grades, newGrade];
        }
        return { ...prev, grades: newGrades } as DiaryData;
      });
    } catch {}
    setEditingCell(null);
    setEditingValue("");
  };
   
  const normalizedHolidays = initialHolidays && Object.values(initialHolidays).some(v => v && v.trim() !== "")
    ? initialHolidays
    : { autumn: "28.10 - 03.11", winter: "25.12 - 08.01", spring: "24.03 - 30.03", summer: "01.06 - 31.08" };

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
    // Используем ?? вместо || чтобы пустая строка (назначенный учитель без имени) не заменялась на fallback
    homeroomTeacher: initialHomeroomTeacherName ?? initialContacts?.homeroomTeacher ?? "",
    homeroomTeacherPhone: initialHomeroomTeacherPhone ?? initialContacts?.homeroomTeacherPhone ?? "",
    psychologist: initialContacts?.psychologist || "",
    psychologistPhone: initialContacts?.psychologistPhone || "",
    socialPedagogue: initialContacts?.socialPedagogue || "",
    holidays: normalizedHolidays,
  });

  const [contacts, setContacts] = useState({
    director: initialDirectorName || initialContacts?.director || "",
    directorPhone: initialContacts?.directorPhone || "",
    vicePrincipal: initialContacts?.vicePrincipal || "",
    vicePrincipalPhone: initialContacts?.vicePrincipalPhone || "",
    vicePrincipalEdu: initialContacts?.vicePrincipalEdu || "",
    vicePrincipalEduPhone: initialContacts?.vicePrincipalEduPhone || "",
    // Используем ?? вместо || чтобы пустая строка (назначенный учитель без имени) не заменялась на fallback
    homeroomTeacher: initialHomeroomTeacherName ?? initialContacts?.homeroomTeacher ?? "",
    homeroomTeacherPhone: initialHomeroomTeacherPhone ?? initialContacts?.homeroomTeacherPhone ?? "",
    psychologist: initialContacts?.psychologist || "",
    psychologistPhone: initialContacts?.psychologistPhone || "",
    socialPedagogue: initialContacts?.socialPedagogue || "",
    socialPedagoguePhone: initialContacts?.socialPedagoguePhone || "",
  });
  
  // Расписание звонков
  const [bellSchedule, setBellSchedule] = useState([
    { number: "1", start: "08:00", end: "08:45", break: "10" },
    { number: "2", start: "08:55", end: "09:40", break: "10" },
    { number: "3", start: "09:50", end: "10:35", break: "15" },
    { number: "4", start: "10:50", end: "11:35", break: "15" },
    { number: "5", start: "11:50", end: "12:35", break: "10" },
    { number: "6", start: "12:45", end: "13:30", break: "10" },
    { number: "7", start: "13:40", end: "14:25", break: "10" },
    { number: "8", start: "14:35", end: "15:20", break: "" },
  ]);
  
  const updateBellSchedule = (index: number, field: string, value: string) => {
    if (!canEditContacts()) return;
    const newSchedule = [...bellSchedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setBellSchedule(newSchedule);
  };
  
  // Пользовательские праздники
  type HolidayCategory = 'state' | 'memorial' | 'professional';
  interface CustomHoliday {
    id: string;
    date: string;
    name: string;
    category: HolidayCategory;
  }

  const [customHolidays, setCustomHolidays] = useState<CustomHoliday[]>([]);

  // Настройка: отключенные праздники (не засчитываются как выходные)
  const [disabledHolidays, setDisabledHolidays] = useState<Set<string>>(new Set());

  const toggleHolidayDisabled = (holidayKey: string) => {
    setDisabledHolidays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(holidayKey)) {
        newSet.delete(holidayKey);
      } else {
        newSet.add(holidayKey);
      }
      return newSet;
    });
  };

  const [newHolidayForm, setNewHolidayForm] = useState({
    date: '',
    name: '',
    category: 'state' as HolidayCategory
  });
  
  const addCustomHoliday = () => {
    if (!newHolidayForm.date || !newHolidayForm.name) return;
    
    const newHoliday: CustomHoliday = {
      id: Date.now().toString(),
      date: newHolidayForm.date,
      name: newHolidayForm.name,
      category: newHolidayForm.category
    };
    
    setCustomHolidays([...customHolidays, newHoliday]);
    setNewHolidayForm({ date: '', name: '', category: 'state' });
  };
  
  // Модальное окно подтверждения удаления
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);
  const [holidayToDeleteName, setHolidayToDeleteName] = useState('');
  
  const confirmDeleteHoliday = (id: string, name: string) => {
    setHolidayToDelete(id);
    setHolidayToDeleteName(name);
    setShowDeleteConfirm(true);
  };
  
  const removeCustomHoliday = () => {
    if (holidayToDelete) {
      setCustomHolidays(customHolidays.filter(h => h.id !== holidayToDelete));
      setShowDeleteConfirm(false);
      setHolidayToDelete(null);
      setHolidayToDeleteName('');
    }
  };
  
  // Получить все праздники (встроенные + пользовательские) по категории
  const getAllHolidaysByCategory = (category: HolidayCategory) => {
    const custom = customHolidays.filter(h => h.category === category);
    return custom;
  };
  
  const [showNoClassModal, setShowNoClassModal] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<string>(() => getQuarterNumber(new Date()));
  const [scheduleData, setScheduleData] = useState<Record<string, string>>({});
  const [dbSchedule, setDbSchedule] = useState<Lesson[]>([]);
  const [absence, setAbsence] = useState({ absent: "", absentUnexcused: "" });
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Отметки для уроков (контрольная, самостоятельная, ключевое событие)
  type LessonMarkType = 'test' | 'independent' | 'key-event' | null;
  interface LessonMarkInfo {
    type: LessonMarkType;
    comment: string;
  }
  const [lessonMarks, setLessonMarks] = useState<Record<string, LessonMarkInfo>>({});

  // Контекстное меню для уроков
  interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    dayName: string;
    lessonNumber: number;
    lessonKey: string;
  }
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    dayName: '',
    lessonNumber: 0,
    lessonKey: ''
  });

  // Для обмена уроками
  const [swapSource, setSwapSource] = useState<{dayName: string, lessonNumber: number, lessonKey: string} | null>(null);

  // Модальное окно редактирования расписания
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Модальное окно редактирования урока
  interface LessonEditModalState {
    visible: boolean;
    dayName: string;
    lessonNumber: number;
    lessonKey: string;
    currentSubject: string;
    dayDate: Date | null;
    applyToSingleDay: boolean;
  }
  const [lessonEditModal, setLessonEditModal] = useState<LessonEditModalState>({
    visible: false,
    dayName: '',
    lessonNumber: 0,
    lessonKey: '',
    currentSubject: '',
    dayDate: null,
    applyToSingleDay: false
  });

  // Модальное окно добавления урока
  interface AddLessonModalState {
    visible: boolean;
    dayName: string;
    dayDate: Date;
  }
  const [addLessonModal, setAddLessonModal] = useState<AddLessonModalState>({
    visible: false,
    dayName: '',
    dayDate: new Date()
  });

  // Временный select для тестирования ролей
  const [tempUserRole, setTempUserRole] = useState<string>(userRole);

  // ============================================================================
  // ПРОВЕРКА РОЛЕЙ
  // ============================================================================

  const effectiveUserRole = tempUserRole || userRole;

  const sortedAvailableSubjects = useMemo(() =>
    [...availableSubjects].sort((a, b) => a.localeCompare(b, 'ru')),
    [availableSubjects]
  );

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
      // Ищем записи для текущей четверти ИЛИ общие записи без четверти (начинаются с "-")
      if (key.startsWith(`${quarter}-`) || key.startsWith('-')) {
        const parts = key.split('-');
        // Обычный формат: quarter-day-lessonNum (3 части) или -day-lessonNum для общих записей
        if (parts.length === 3) {
          result[`${parts[1]}-${parts[2]}`] = value;
        }
      }
    });
    return result;
  }, [scheduleData]);

  // Получить уроки для конкретного дня с учетом специфических записей на дату
  const getDayLessons = useCallback((quarter: string, dayName: string, date: Date): Array<{lessonNumber: number; subject: string}> => {
    const dateStr = date.toISOString().split('T')[0];
    const lessons: Array<{lessonNumber: number; subject: string}> = [];
    const processedLessons = new Set<number>();
    
    // Сначала ищем специфические записи на эту дату (формат: quarter-YYYY-MM-DD-day-lessonNum)
    // Или общие записи без четверти (-YYYY-MM-DD-day-lessonNum)
    Object.entries(scheduleData).forEach(([key, value]) => {
      if (key.startsWith(`${quarter}-${dateStr}-${dayName}-`) || key.startsWith(`-${dateStr}-${dayName}-`)) {
        const parts = key.split('-');
        if (parts.length === 5) {
          const lessonNum = parseInt(parts[4]);
          lessons.push({ lessonNumber: lessonNum + 1, subject: value });
          processedLessons.add(lessonNum);
        }
      }
    });
    
    // Затем добавляем общие записи (формат: quarter-day-lessonNum или -day-lessonNum)
    Object.entries(scheduleData).forEach(([key, value]) => {
      if (key.startsWith(`${quarter}-${dayName}-`) || key.startsWith(`-${dayName}-`)) {
        const parts = key.split('-');
        if (parts.length === 3) {
          const lessonNum = parseInt(parts[2]);
          if (!processedLessons.has(lessonNum)) {
            lessons.push({ lessonNumber: lessonNum + 1, subject: value });
          }
        }
      }
    });
    
    return lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
  }, [scheduleData]);

  const quarterSchedule = getScheduleForQuarter(selectedQuarter);

  const updateScheduleItem = (quarter: string, day: string, lessonNum: number, subject: string, date?: Date) => {
    if (!canEditSchedule()) return;
    // Если указана дата и применяем только на один день - используем дату в ключе
    const dateStr = date ? date.toISOString().split('T')[0] : null;
    const key = dateStr ? `${quarter}-${dateStr}-${day}-${lessonNum}` : `${quarter}-${day}-${lessonNum}`;
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
  // КОНТЕКСТНОЕ МЕНЮ ДЛЯ УРОКОВ
  // ============================================================================

  const handleLessonContextMenu = (e: React.MouseEvent, dayName: string, lessonNumber: number, lessonKey: string) => {
    if (!canEditSchedule()) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      dayName,
      lessonNumber,
      lessonKey
    });
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const removeLesson = (dayName: string, lessonNumber: number) => {
    if (!canEditSchedule()) return;
    const key = `${selectedQuarter}-${dayName}-${lessonNumber - 1}`;
    const newSchedule = { ...scheduleData };
    delete newSchedule[key];
    setScheduleData(newSchedule);
    if (studentGroupId) {
      saveClassScheduleLocal(studentGroupId, newSchedule);
    }
    closeContextMenu();
  };

  const addLesson = (dayName: string, lessonNumber: number, subject: string) => {
    if (!canEditSchedule()) return;
    const key = `${selectedQuarter}-${dayName}-${lessonNumber - 1}`;
    const newSchedule = { ...scheduleData, [key]: subject };
    setScheduleData(newSchedule);
    if (studentGroupId) {
      saveClassScheduleLocal(studentGroupId, newSchedule);
    }
    closeContextMenu();
  };

  const swapLessons = (targetDayName: string, targetLessonNumber: number) => {
    if (!canEditSchedule() || !swapSource) return;

    const sourceKey = `${selectedQuarter}-${swapSource.dayName}-${swapSource.lessonNumber - 1}`;
    const targetKey = `${selectedQuarter}-${targetDayName}-${targetLessonNumber - 1}`;

    const sourceValue = scheduleData[sourceKey] || '';
    const targetValue = scheduleData[targetKey] || '';

    const newSchedule = { ...scheduleData };

    if (targetValue) {
      newSchedule[sourceKey] = targetValue;
    } else {
      delete newSchedule[sourceKey];
    }

    if (sourceValue) {
      newSchedule[targetKey] = sourceValue;
    } else {
      delete newSchedule[targetKey];
    }

    setScheduleData(newSchedule);
    if (studentGroupId) {
      saveClassScheduleLocal(studentGroupId, newSchedule);
    }

    setSwapSource(null);
    closeContextMenu();
  };

  const markLesson = (dayName: string, lessonNumber: number, markType: LessonMarkType, comment?: string) => {
    if (!canEditSchedule()) return;
    const key = `${selectedQuarter}-${dayName}-${lessonNumber}`;
    const newMarks = { ...lessonMarks };
    if (markType) {
      newMarks[key] = { type: markType, comment: comment || newMarks[key]?.comment || '' };
    } else {
      delete newMarks[key];
    }
    setLessonMarks(newMarks);
    closeContextMenu();
  };

  const updateLessonComment = (dayName: string, lessonNumber: number, comment: string) => {
    if (!canEditSchedule()) return;
    const key = `${selectedQuarter}-${dayName}-${lessonNumber}`;
    const currentMark = lessonMarks[key];
    if (currentMark) {
      setLessonMarks({ ...lessonMarks, [key]: { ...currentMark, comment } });
    }
  };

  const getLessonMark = (dayName: string, lessonNumber: number): LessonMarkInfo | null => {
    const key = `${selectedQuarter}-${dayName}-${lessonNumber}`;
    return lessonMarks[key] || null;
  };

  const getLessonMarkType = (dayName: string, lessonNumber: number): LessonMarkType => {
    return getLessonMark(dayName, lessonNumber)?.type || null;
  };

  const getLessonMarkColor = (mark: LessonMarkType): string => {
    switch (mark) {
      case 'test': return 'bg-red-100 border-red-300';
      case 'independent': return 'bg-blue-100 border-blue-300';
      case 'key-event': return 'bg-purple-100 border-purple-300';
      default: return 'bg-emerald-50 border-emerald-100';
    }
  };

  const getLessonMarkLabel = (mark: LessonMarkType): string => {
    switch (mark) {
      case 'test': return '📝 Контрольная';
      case 'independent': return '✏️ Самостоятельная';
      case 'key-event': return '⭐ Ключевое событие';
      default: return '';
    }
  };

  const openLessonEditModal = (dayName: string, lessonNumber: number, lessonKey: string, currentSubject: string, dayDate: Date) => {
    if (!canEditSchedule()) return;
    setLessonEditModal({
      visible: true,
      dayName,
      lessonNumber,
      lessonKey,
      currentSubject,
      dayDate,
      applyToSingleDay: false
    });
  };

  const closeLessonEditModal = () => {
    setLessonEditModal(prev => ({ ...prev, visible: false }));
  };

  const openAddLessonModal = (dayName: string, dayDate: Date) => {
    if (!canEditSchedule()) return;
    setAddLessonModal({
      visible: true,
      dayName,
      dayDate
    });
  };

  const closeAddLessonModal = () => {
    setAddLessonModal(prev => ({ ...prev, visible: false }));
  };

  const handleAddLessonInDay = (dayName: string, lessonNum: number, subject: string) => {
    if (!canEditSchedule()) return;
    const key = `${selectedQuarter}-${dayName}-${lessonNum - 1}`;
    const newSchedule = { ...scheduleData, [key]: subject };
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

  // Загрузка расписания из API при изменении четверти (как в /teacher)
  useEffect(() => {
    if (!studentGroupId) return;
    fetch(`/api/schedule?groupId=${studentGroupId}&quarter=${selectedQuarter}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
.then((data) => {
          if (Array.isArray(data)) {
            setDbSchedule(data);
            const fromDb: Record<string, string> = {};
            for (const item of data) {
              if (item.dayOfWeek && item.lessonNumber && item.subjectName) {
                const dayFull = DAYS_OF_WEEK.find(d => d.dayOfWeek === item.dayOfWeek)?.name;
                if (dayFull) {
                  const q = item.quarter ?? '';
                  const key = `${q}-${dayFull}-${item.lessonNumber - 1}`;
                  fromDb[key] = item.subjectName;
                }
              }
            }
            // If group changed: replace entire schedule. If only quarter changed: merge.
            const groupChanged = prevGroupIdRef.current !== studentGroupId;
            if (groupChanged) {
              setScheduleData(fromDb);
              prevGroupIdRef.current = studentGroupId;
            } else {
              setScheduleData(prev => {
                const quarterPrefix = `${selectedQuarter}-`;
                const merged = { ...prev };
                for (const key of Object.keys(merged)) {
                  if (key.startsWith(quarterPrefix)) {
                    delete merged[key];
                  }
                }
                for (const [key, value] of Object.entries(fromDb)) {
                  merged[key] = value;
                }
                return merged;
              });
            }
          }
        })
      .catch((err) => console.error("Ошибка загрузки расписания:", err));
  }, [studentGroupId, selectedQuarter]);

  useEffect(() => {
    // Загрузка пропусков
    const savedAbsence = getWeeklyAbsenceLocal(studentId);
    setAbsence(savedAbsence);
    
    // Загрузка предметов - для расписания все предметы, для таблицы только обычные
    setAvailableSubjects(scheduleSubjectNames.length > 0 ? scheduleSubjectNames : classSubjectNames);
    
    // Обновляем data.subjects при изменении доступных предметов (только обычные)
    if (classSubjectNames.length > 0) {
      setData(prev => ({
        ...prev,
        subjects: classSubjectNames.map(name => {
          // Ищем существующий предмет чтобы сохранить учителя и gradeType
          const existing = prev.subjects.find(s => s.name === name);
          return {
            name,
            teacher: existing?.teacher || "",
            gradeType: existing?.gradeType || "numeric"
          };
        })
      }));
    }
    
    // Загрузка начальных subjects если их еще нет
    if (data.subjects.length === 0) {
      // Инициализация начальными данными
      // Приоритет: 1) classSubjectNames (фильтр предметов для класса), 2) schedule
      const initialSubjects = classSubjectNames.length > 0
        ? classSubjectNames.map(name => {
            const scheduleTeacher = schedule.find(l => l.subjectName === name && l.teacherName)?.teacherName || "";
            const mappedTeacher = subjectTeacherMap?.[name] || "";
            return { name, teacher: scheduleTeacher || mappedTeacher };
          })
        : schedule.reduce((acc: { name: string; teacher: string }[], lesson) => {
            if (lesson.subjectName && !acc.find(s => s.name === lesson.subjectName)) {
              const mappedTeacher = subjectTeacherMap?.[lesson.subjectName] || "";
              acc.push({ name: lesson.subjectName, teacher: lesson.teacherName || mappedTeacher || "" });
            }
            return acc;
          }, []);

      setData(prev => ({
        ...prev,
        surname: studentFullName.split(" ")[0] || "",
        name: studentFullName.split(" ").slice(1).join(" ") || studentFullName,
        grade: studentGrade,
        academicYear: getCurrentAcademicYear(),
        subjects: initialSubjects,
        holidays: { autumn: "28.10 - 03.11", winter: "25.12 - 08.01", spring: "24.03 - 30.03", summer: "01.06 - 31.08" },
      }));
    }
    
    setIsLoaded(true);
  }, [studentFullName, studentGrade, studentGroupId, studentId, schedule, classSubjectNames]);

  // Загрузка аттестации (итоговых оценок) из БД после инициализации
  // Загружаем только один раз при isLoaded=true, не зависим от data
  useEffect(() => {
    if (!isLoaded || !studentId) return;
    // Используем getCurrentAcademicYear() напрямую, не берем из data
    const academicYear = getCurrentAcademicYear();
    // Добавляем timestamp чтобы избежать кэширования
    const timestamp = Date.now();
    fetch(`/api/final-grades?studentId=${studentId}&academicYear=${encodeURIComponent(academicYear)}&_t=${timestamp}`)
      .then(res => res.json())
      .then((finalGradesData: any[]) => {
        if (Array.isArray(finalGradesData) && finalGradesData.length > 0) {
          setData(prev => {
            const newGrades = finalGradesData.map(fg => ({
              subject: fg.subjectName || '',
              q1: fg.q1 || '',
              q2: fg.q2 || '',
              q3: fg.q3 || '',
              q4: fg.q4 || '',
              year: fg.year || '',
              exam: fg.exam || '',
              final: fg.final || '',
              gradeType: fg.gradeType,
            }));
            
            // Обновляем существующие предметы
            const existingNames = new Set(prev.subjects.map(s => s.name));
            const updatedSubjects = prev.subjects.map(s => {
              const fromApi = finalGradesData.find(fg => fg.subjectName === s.name);
              const newGradeType = fromApi?.gradeType || s.gradeType || 'numeric';
              return { ...s, gradeType: newGradeType };
            });
            
            // Добавляем новые предметы из API которых нет в списке
            const newSubjectsFromApi = finalGradesData
              .filter(fg => fg.subjectName && !existingNames.has(fg.subjectName))
              .map(fg => {
                const scheduleTeacher = schedule.find(l => l.subjectName === fg.subjectName && l.teacherName)?.teacherName || "";
                const mappedTeacher = subjectTeacherMap?.[fg.subjectName!] || "";
                return {
                  name: fg.subjectName!,
                  teacher: scheduleTeacher || mappedTeacher,
                  gradeType: fg.gradeType || 'numeric'
                };
              });
            
            const mergedSubjects = [...updatedSubjects, ...newSubjectsFromApi];
            return { ...prev, grades: newGrades, subjects: mergedSubjects };
          });
        }
      })
      .catch((err) => { console.error('[StudentDiary] Error loading final grades:', err); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, studentId]); // Не зависим от data, загружаем один раз

  // Загрузка замечаний
  useEffect(() => {
    if (!isLoaded || !studentId) return;
    const params = new URLSearchParams({ studentId });
    if (effectiveUserRole === "teacher" && !isHomeroomTeacher) {
      params.set("teacherId", currentUserId || "");
    }
    fetch(`/api/teacher-comments?${params}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setComments(data); })
      .catch(() => {});
  }, [isLoaded, studentId, effectiveUserRole, isHomeroomTeacher, currentUserId]);

  // Загрузка подтверждений четвертей
  useEffect(() => {
    if (!isLoaded || !studentGroupId) return;
    const academicYear = getCurrentAcademicYear();
    fetch(`/api/quarter-confirm?groupId=${studentGroupId}&academicYear=${encodeURIComponent(academicYear)}`)
      .then(res => res.json())
      .then((data: any[]) => {
        const map: Record<string, { confirmedByTeacher: string | null; confirmedByTeacherAt: string | null; confirmedByParent: string | null; confirmedByParentAt: string | null }> = {};
        for (const row of data) {
          const key = String(row.quarter);
          map[key] = {
            confirmedByTeacher: row.confirmedByTeacher || null,
            confirmedByTeacherAt: row.confirmedByTeacherAt || null,
            confirmedByParent: row.confirmedByParent || null,
            confirmedByParentAt: row.confirmedByParentAt || null,
          };
        }
        setQuarterConfirmations(map);
      })
      .catch(() => {});
  }, [isLoaded, studentGroupId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem("diary_shared_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSharedData(prev => {
          const merged = { ...prev };
          for (const [key, value] of Object.entries(parsed)) {
            const prevValue = (prev as any)[key];
            // Для объектов (holidays и т.п.) делаем глубокое слияние
            if (value && typeof value === 'object' && !Array.isArray(value) && prevValue && typeof prevValue === 'object') {
              (merged as any)[key] = { ...prevValue, ...value };
            } else if (value !== undefined && value !== null && value !== '') {
              // Для строк и других значений — перезаписываем
              (merged as any)[key] = value;
            } else if (!prevValue) {
              (merged as any)[key] = value;
            }
          }
          return merged;
        });
        setContacts(prev => {
          const updated = { ...prev };
          for (const [key, value] of Object.entries(parsed)) {
            if (key in updated && value !== undefined && value !== null && value !== '') {
              (updated as any)[key] = value;
            }
          }
          return updated;
        });
      } catch {}
    }
    
    // Загружаем пользовательские праздники
    const savedHolidays = localStorage.getItem("diary_custom_holidays");
    if (savedHolidays) {
      try {
        const parsedHolidays = JSON.parse(savedHolidays);
        if (Array.isArray(parsedHolidays)) {
          setCustomHolidays(parsedHolidays);
        }
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

  // Закрытие контекстного меню по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
        setSwapSource(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

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
    // Не сохраняем subjects в localStorage
    const { subjects: _, ...dataWithoutSubjects } = newData;
    saveDiaryDataLocal(studentId, dataWithoutSubjects);
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
    // Не сохраняем subjects в localStorage (gradeType должен приходить из API)
    const { subjects: _, ...dataWithoutSubjects } = data;
    saveDiaryDataLocal(studentId, dataWithoutSubjects);
    const merged = { ...sharedData, ...contacts };
    setSharedData(merged);
    localStorage.setItem("diary_shared_data", JSON.stringify(merged));
    // Сохраняем пользовательские праздники
    localStorage.setItem("diary_custom_holidays", JSON.stringify(customHolidays));
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
        holidays: merged.holidays,
        academicYear: merged.academicYear,
      });
    }

    // Сохраняем аттестацию (итоговые оценки) в БД
    if (Array.isArray(data.grades) && data.grades.length > 0) {
      for (const grade of data.grades) {
        const qs = data.subjects.find(s => s.name === grade.subject);
        fetch('/api/final-grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            subjectName: grade.subject,
            academicYear: data.academicYear || getCurrentAcademicYear(),
            q1: grade.q1 || '',
            q2: grade.q2 || '',
            q3: grade.q3 || '',
            q4: grade.q4 || '',
            year: grade.year || '',
            exam: grade.exam || '',
            final: grade.final || '',
            gradeType: qs?.gradeType || grade.gradeType || 'numeric',
          }),
        }).catch(() => {});
      }
    }
    alert("Дневник сохранен!");
  };

  const handlePrint = () => {
    window.print();
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === "prev" ? -7 : 7));

    // Проверяем границы учебного года (сентябрь – май)
    if (!isDateInAcademicYear(newWeek)) {
      return;
    }

    setSelectedWeek(getStartOfWeek(newWeek));
    setSelectedQuarter(getQuarterNumber(newWeek));
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

  const baseSections = [
    { id: "week", label: "📅 Расписание" },
    { id: "allgrades", label: "📈 Оценки" },
    ...(effectiveUserRole === "admin" || effectiveUserRole === "principal" || isHomeroomTeacher || effectiveUserRole === "parent"
      ? [{ id: "summary", label: "📋 Сведения" }]
      : []),
    { id: "title", label: "📝 Титульный" },
    { id: "comments", label: "⚠️ Замечания" },
    { id: "contacts", label: "📞 Контакты" },
    { id: "subjects", label: "📚 Предметы" },
    { id: "grades", label: "📊 Аттестация" },
    { id: "holidays", label: "🏖️ Каникулы" },
    { id: "official", label: "🎉 Праздники" },
  ];

  const sections = userRole === "admin" || userRole === "principal" || userRole === "parent"
    ? baseSections
    : baseSections.filter(s => s.id !== "official");

  // ============================================================================
  // РЕНДЕРИНГ МОДАЛЬНЫХ ОКОН
  // ============================================================================

  const renderScheduleModal = () => {
    if (!showScheduleModal || !canEditSchedule()) return null;

    const topRowDays = DAYS_OF_WEEK.slice(0, 3);
    const bottomRowDays = DAYS_OF_WEEK.slice(3);

    return (
      <div 
        className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-2"
        onClick={(e) => { if (e.target === e.currentTarget) setShowScheduleModal(false); }}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-3">
             <div>
               <h2 className="text-lg font-bold text-emerald-800">
                 Редактирование расписания — {selectedQuarter} четверть
               </h2>
                {availableSubjects.length === 0 && (
                  <div className="mt-2 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-bold mb-2">⚠️ Предметы не найдены!</p>
                    <p className="text-xs text-red-600 mb-2">Возможные причины:</p>
                    <ul className="text-xs text-red-600 list-disc list-inside mb-3">
                      <li>Нет расписания для этого класса</li>
                      <li>Не назначены предметы в фильтре (Админ → Предметы)</li>
                      <li>База данных пуста</li>
                    </ul>
                    {canEditContacts() && (
                      <button
                        onClick={() => window.location.href = '/admin/subjects'}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                      >
                        Перейти к назначению предметов →
                      </button>
                    )}
                  </div>
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
                          {sortedAvailableSubjects.map((subject) => (
                            <option key={subject} value={subject} className="text-emerald-900 font-semibold">
                              {eventSubjectNames.includes(subject) ? '🎯 ' : specialSubjectNames.includes(subject) ? '🏆 ' : ''}{subject}
                            </option>
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
                          {sortedAvailableSubjects.map((subject) => (
                            <option key={subject} value={subject} className="text-emerald-900 font-semibold">
                              {eventSubjectNames.includes(subject) ? '🎯 ' : specialSubjectNames.includes(subject) ? '🏆 ' : ''}{subject}
                            </option>
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 font-sans pt-4">
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
            <button onClick={() => window.location.href = "/"} className="block w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-md">Назад</button>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования расписания */}
      {renderScheduleModal()}

      <div className="max-w-[210mm] mx-auto bg-white shadow-xl my-0 print:my-0 print:shadow-none rounded-xl overflow-hidden">
        {/* Навигация */}
        <div className="bg-white border-b border-emerald-200 px-2 md:px-4 py-1">
          <div className="relative">
            <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#10b981 #e5e7eb', WebkitOverflowScrolling: 'touch' }}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg whitespace-nowrap transition-all font-medium text-xs md:text-sm flex-shrink-0 ${activeSection === section.id ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"}`}
                >
                  {section.label}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none hidden md:block"></div>
          </div>
        </div>

        {/* Шапка с профилем — после навигации */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200 px-3 md:px-4 py-2 md:py-3 mb-4 relative">
          <div className="flex justify-between items-center flex-wrap gap-2 relative z-10">
            <div className="flex items-center gap-2 md:gap-3">
              <a
                href={effectiveUserRole === "admin" ? "/admin" : effectiveUserRole === "teacher" ? "/teacher" : effectiveUserRole === "parent" ? "/" : "/diary"}
                className="inline-flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all text-xs md:text-sm font-semibold"
              >
                Назад
              </a>
            </div>

            <div className="flex items-center gap-3">
              {effectiveUserRole === "admin" && (
                <>
                  <a
                    href="/diary"
                    className="inline-flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all text-xs md:text-sm font-semibold"
                  >
                    🔄 <span className="hidden md:inline">Сменить класс и/или ученика</span><span className="md:hidden">Сменить</span>
                  </a>
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
                </>
              )}
            </div>
          </div>

          {/* ФИО и класс — по центру */}
          <div className="flex items-center justify-center gap-2 md:gap-3 mt-2">
            <div
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-300 cursor-pointer hover:opacity-80 transition-opacity shrink-0 flex items-center justify-center"
              onClick={() => userAvatar && setShowAvatarModal(true)}
            >
              {userAvatar ? (
                <Image
                  src={userAvatar}
                  alt="Avatar"
                  fill
                  className="object-cover rounded-full"
                  style={{ aspectRatio: '1/1' }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shrink-0">
                  {studentFullName.charAt(0)}
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-800">{studentFullName}</p>
              <p className="text-sm text-gray-600">{studentGrade}</p>
            </div>
          </div>
        </div>

        {/* Титульный лист */}
        {activeSection === "title" && (
          <div className="p-3 md:p-8 bg-gradient-to-b from-amber-50/50 to-white">
            <div className="text-center mb-8">
              <div className="text-4xl mb-2">🎓</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">Дневник учащегося</h2>
              <p className="text-gray-500 text-sm">официальный документ</p>
              {canEditInstitution() && <p className="text-xs text-emerald-600 mt-2">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса</p>}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-emerald-100">
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

        {/* Замечания */}
        {activeSection === "comments" && (
          <div className="min-h-[600px] p-8 md:p-12 bg-gradient-to-b from-rose-50/50 to-white">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">⚠️</div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-red-600 tracking-tight">
                  Замечания
                </h2>
                <p className="text-gray-400 text-sm mt-1 font-medium">учителей и классного руководителя</p>
              </div>
              {effectiveUserRole === "admin" && comments.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={() => setShowConfirmClearComments(true)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-bold hover:bg-red-200 transition-all border border-red-200 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Очистить все замечания
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="bg-white dark:bg-[#181825] rounded-2xl shadow-sm border border-rose-100 dark:border-rose-900 p-10 text-center">
                    <div className="text-5xl mb-4">✨</div>
                    <p className="text-gray-500 dark:text-[#a6adc8] text-lg font-semibold">Нет замечаний</p>
                    <p className="text-gray-400 dark:text-[#7f849c] text-sm mt-1">У ученика пока нет замечаний от учителей</p>
                  </div>
                ) : (
                  <>
                    {comments.slice((commentsPage - 1) * commentsPerPage, commentsPage * commentsPerPage).map(c => (
                      <div key={c.id} className="bg-white dark:bg-[#181825] rounded-2xl shadow-sm border border-rose-100 dark:border-rose-900 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {(c.teacherName || "У")[0]}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800 dark:text-[#cdd6f4] text-sm">{c.teacherName || "Учитель"}</p>
                              <p className="text-[11px] text-gray-600 dark:text-[#a6adc8] font-medium">{new Date(c.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-rose-50/70 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-100 dark:border-rose-800">
                          <p className="text-gray-700 dark:text-[#bac2de] text-sm leading-relaxed">{c.comment}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length > commentsPerPage && (
                      <div className="flex justify-center items-center gap-2 mt-4">
                        <button
                          onClick={() => setCommentsPage(p => Math.max(1, p - 1))}
                          disabled={commentsPage === 1}
                          className="px-3 py-2 rounded-lg bg-white dark:bg-[#1e1e2e] border border-gray-200 dark:border-[#45475a] text-gray-700 dark:text-[#cdd6f4] hover:bg-gray-50 dark:hover:bg-[#313244] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                        >
                          ← Назад
                        </button>
                        <span className="text-sm text-gray-600 dark:text-[#a6adc8] font-medium">
                          {commentsPage} / {Math.ceil(comments.length / commentsPerPage)}
                        </span>
                        <button
                          onClick={() => setCommentsPage(p => Math.min(Math.ceil(comments.length / commentsPerPage), p + 1))}
                          disabled={commentsPage >= Math.ceil(comments.length / commentsPerPage)}
                          className="px-3 py-2 rounded-lg bg-white dark:bg-[#1e1e2e] border border-gray-200 dark:border-[#45475a] text-gray-700 dark:text-[#cdd6f4] hover:bg-gray-50 dark:hover:bg-[#313244] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                        >
                          Вперёд →
                        </button>
                      </div>
                    )}
                  </>
                )}

                {(effectiveUserRole === "admin" || effectiveUserRole === "teacher" || effectiveUserRole === "principal") && !showConfirmComment && (
                  <div className="mt-8 bg-white rounded-2xl shadow-md border border-rose-200 p-6">
                    <h3 className="font-extrabold text-gray-800 mb-4 text-base flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-sm">✏️</span>
                      Добавить замечание
                    </h3>
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none transition-all bg-white"
                      rows={4}
                      placeholder="Опишите замечание..."
                    />
                    <button
                      onClick={() => { if (newComment.trim()) setShowConfirmComment(true); }}
                      disabled={!newComment.trim() || addingComment}
                      className="mt-3 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl hover:from-rose-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-300 text-sm font-bold transition-all shadow-md"
                    >
                      Добавить замечание
                    </button>
                  </div>
                )}
              </div>
            </div>

            {showConfirmComment && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3">⚠️</div>
                    <h3 className="text-xl font-extrabold text-gray-800">Подтверждение</h3>
                    <p className="text-gray-500 text-sm mt-1">Вы уверены, что хотите добавить замечание?</p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-4 mb-5 text-sm text-gray-700 border border-rose-200 leading-relaxed">
                    {newComment}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowConfirmComment(false)}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-bold transition-all"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={async () => {
                        setAddingComment(true);
                        try {
                          await fetch('/api/teacher-comments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              studentId,
                              teacherId: currentUserId,
                              teacherName: currentUserName,
                              comment: newComment,
                            }),
                          });
                          setNewComment("");
                          setShowConfirmComment(false);
                          const params = new URLSearchParams({ studentId });
                          if (effectiveUserRole === "teacher" && !isHomeroomTeacher) {
                            params.set("teacherId", currentUserId || "");
                          }
                          const res = await fetch(`/api/teacher-comments?${params}`);
                          const data = await res.json();
                          if (Array.isArray(data)) setComments(data);
                        } catch {}
                        setAddingComment(false);
                      }}
                      disabled={addingComment}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl hover:from-rose-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-300 text-sm font-bold transition-all shadow-md"
                    >
                      {addingComment ? "Сохранение..." : "Добавить"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Подтверждение очистки замечаний */}
        {showConfirmClearComments && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">🗑️</div>
                <h3 className="text-xl font-extrabold text-gray-800">Удалить все замечания?</h3>
                <p className="text-gray-500 text-sm mt-1">Это действие нельзя отменить. Все замечания будут удалены навсегда.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmClearComments(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-bold transition-all"
                >
                  Отмена
                </button>
                <button
                  onClick={async () => {
                    setClearingComments(true);
                    try {
                      const res = await fetch('/api/teacher-comments', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ studentId, clearAll: true }),
                      });
                      if (res.ok) {
                        setComments([]);
                        setShowConfirmClearComments(false);
                      }
                    } catch {}
                    setClearingComments(false);
                  }}
                  disabled={clearingComments}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-300 text-sm font-bold transition-all shadow-md"
                >
                  {clearingComments ? "Удаление..." : "Удалить все"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Контакты */}
        {activeSection === "contacts" && (
          <div className="min-h-[297mm] p-4 md:p-12 bg-gradient-to-b from-violet-50/50 to-white">
            <div className="text-center mb-4 md:mb-10"><div className="text-3xl md:text-4xl mb-2">📞</div><h2 className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Контактная информация</h2>
            {canEditContacts() && <p className="text-xs text-violet-500 mt-2">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса</p>}
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-10 items-start">
              {[
                {label: "👔 Руководитель учреждения", field: "director" as const, phoneField: "directorPhone" as const, isDirector: true, readOnlyName: false},
                {label: "🍎 Классный руководитель", field: "homeroomTeacher" as const, phoneField: "homeroomTeacherPhone" as const, isHomeroom: true, readOnlyName: true},
                {label: "📚 Заместитель по учебной работе", field: "vicePrincipal" as const, phoneField: "vicePrincipalPhone" as const, readOnlyName: false},
                {label: "🌟 Заместитель по воспитательной работе", field: "vicePrincipalEdu" as const, phoneField: "vicePrincipalEduPhone" as const, readOnlyName: false},
                {label: "🧠 Педагог-психолог", field: "psychologist" as const, phoneField: "psychologistPhone" as const, readOnlyName: false},
                {label: "🤝 Социальный педагог", field: "socialPedagogue" as const, phoneField: "socialPedagoguePhone" as const, readOnlyName: false},
              ].map((contact, i) => (
                <div key={i} className="bg-white border border-violet-100 rounded-xl p-4 shadow-md">
                  <label className="block text-sm font-bold text-violet-700 mb-2">
                    {contact.label}
                    {canEditContacts() && contact.isHomeroom && (
                      <span className="block text-xs text-amber-600 font-normal mt-1">💡 Классный руководитель вставляется автоматически в зависимости от выбранного класса</span>
                    )}
                    {canEditContacts() && contact.isDirector && effectiveUserRole === "admin" && (
                      <span className="block text-xs text-blue-600 font-normal mt-1">💡 ФИО выбирается от роли директора, аккаунт которого первый назначился, в противном случае редактируйте если отображается неккоректно</span>
                    )}
                    {canEditContacts() && !contact.isDirector && !contact.isHomeroom && (
                      <span className="block text-xs text-violet-500 font-normal mt-1">💡 Редактируется администратором — заполняется один раз и применяется для всех учеников класса</span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="ФИО"
                    value={contacts[contact.field]}
                    readOnly={!canEditContacts() || contact.readOnlyName}
                    onChange={(e) => updateContact(contact.field, e.target.value)}
                    className={`w-full border-b-2 border-violet-200 py-2 text-gray-800 font-bold mb-2 ${canEditContacts() && !contact.readOnlyName ? 'bg-white' : 'bg-gray-100'}`}
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
            
            {/* Расписание звонков */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🔔</span>
                  <div>
                    <h3 className="text-xl font-bold text-amber-800">Расписание звонков</h3>
                    <p className="text-sm text-amber-600">Расписание уроков и перемен</p>
                  </div>
                </div>
                {canEditContacts() && (
                  <span className="text-xs text-amber-600 bg-amber-100 px-3 py-1 rounded-full">✏️ Режим редактирования</span>
                )}
              </div>
              
              <div className="overflow-hidden rounded-xl border border-amber-200">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-amber-400 to-orange-400 text-white">
                    <tr>
                      <th className="py-3 px-4 text-left font-bold">№</th>
                      <th className="py-3 px-4 text-center font-bold">Начало</th>
                      <th className="py-3 px-4 text-center font-bold">Конец</th>
                      <th className="py-3 px-4 text-center font-bold">Перемена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bellSchedule.map((bell, index) => (
                      <tr key={index} className="bg-white">
                        <td className="py-3 px-4 font-bold text-amber-800">{bell.number}</td>
                        <td className="py-3 px-4">
                          {canEditContacts() ? (
                            <input
                              type="time"
                              value={bell.start}
                              onChange={(e) => updateBellSchedule(index, 'start', e.target.value)}
                              className="w-full text-center border-2 border-amber-200 rounded-lg py-1 px-2 text-amber-800 font-semibold focus:border-amber-400 focus:outline-none"
                            />
                          ) : (
                            <span className="block text-center font-semibold text-gray-800">{bell.start}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {canEditContacts() ? (
                            <input
                              type="time"
                              value={bell.end}
                              onChange={(e) => updateBellSchedule(index, 'end', e.target.value)}
                              className="w-full text-center border-2 border-amber-200 rounded-lg py-1 px-2 text-amber-800 font-semibold focus:border-amber-400 focus:outline-none"
                            />
                          ) : (
                            <span className="block text-center font-semibold text-gray-800">{bell.end}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {canEditContacts() ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="text"
                                value={bell.break}
                                onChange={(e) => updateBellSchedule(index, 'break', e.target.value)}
                                className="w-16 text-center border-2 border-amber-200 rounded-lg py-1 px-2 text-amber-800 font-semibold focus:border-amber-400 focus:outline-none"
                              />
                              <span className="text-sm text-amber-600">мин</span>
                            </div>
                          ) : (
                            <span className="block text-center font-semibold text-gray-800">
                              {bell.break ? `${bell.break} мин` : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {canEditContacts() && (
                <p className="text-xs text-amber-600 mt-4 text-center">
                  💡 Изменения сохраняются автоматически при редактировании
                </p>
              )}
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
                <div className="flex items-center gap-1">
                  <button onClick={() => { setSelectedWeek(getStartOfWeek(new Date())); setSelectedQuarter(getQuarterNumber(new Date())); }} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg font-bold transition-colors" title="Сегодня">📅</button>
                  <button onClick={() => navigateWeek("next")} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-bold">›</button>
                </div>
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
                  // Вычисляем дату для этого дня
                  const dayDate = new Date(selectedWeek);
                  dayDate.setDate(dayDate.getDate() + (day.dayOfWeek - 1));
                  
                  // Получаем уроки с учетом специфических записей на эту дату
                  const dayLessons = getDayLessons(selectedQuarter, day.name, dayDate);
                  
                  // Проверяем каникулы и праздники
const holidayName = getHolidayNameByDate(dayDate);
                   const celebration = getHolidayByDate(dayDate, disabledHolidays);
                   const celebrationName = celebration?.name || null;
                   const isHoliday = holidayName !== null;
                   const isToday = dayDate.toDateString() === new Date().toDateString();
                   
                   return (
                     <div key={day.name} className={`rounded-lg p-3 border-2 ${isHoliday ? 'bg-gradient-to-br from-sky-100 to-blue-100 border-sky-400' : isToday ? 'bg-amber-50 border-amber-400 shadow-md' : 'bg-white border-emerald-200'}`}>
                       <h4 className={`font-bold text-sm mb-2 ${isHoliday ? 'text-sky-900' : isToday ? 'text-amber-700' : 'text-emerald-900'}`}>
                         {day.name}
                         <span className="block text-xs font-normal opacity-75 mt-1">
                           {dayDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                           {isToday && ' • Сегодня'}
                         </span>
                      </h4>
                      
                      {/* Отображение каникул */}
                      {holidayName && (
                        <div className="mb-2 p-2 bg-white/70 rounded-lg text-center">
                          <span className="text-xs font-bold text-sky-700 block">{holidayName}</span>
                          <span className="text-xs text-sky-600 font-medium">Каникулы!</span>
                        </div>
                      )}
                      
                      {/* Отображение праздника */}
                      {celebrationName && !isHoliday && (
                        <div className="mb-2 p-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg border border-amber-300 text-center">
                          <span className="text-xs font-bold text-amber-800 block">{celebrationName}</span>
                        </div>
                      )}
                      
                       {!isHoliday && (
                        <div className="space-y-1">
                          {dayLessons.length === 0 ? (
                            <p className="text-xs text-gray-400 italic text-center py-2">Нет уроков</p>
                          ) : (
                            dayLessons.map(lesson => {
                              const lessonMarkInfo = getLessonMark(day.name, lesson.lessonNumber);
                              const lessonMarkType = lessonMarkInfo?.type || null;
                              const markClass = lessonMarkType ? getLessonMarkColor(lessonMarkType) : 'bg-emerald-50 border-emerald-100';
                              const lessonKey = `${selectedQuarter}-${day.name}-${lesson.lessonNumber - 1}`;
                              const isEventLesson = eventSubjectNames.includes(lesson.subject);
                              const isSpecialLesson = specialSubjectNames.includes(lesson.subject);
                              const eventClass = isEventLesson ? 'bg-emerald-200 border-emerald-500 shadow-sm' : isSpecialLesson ? 'bg-blue-200 border-blue-500 shadow-sm' : '';
                              const eventTextClass = isEventLesson ? 'text-emerald-900' : isSpecialLesson ? 'text-blue-900' : 'text-gray-900';
                              return (
                              <div
                                key={lesson.lessonNumber}
                                className={`flex items-center gap-2 p-1.5 rounded border ${markClass} ${eventClass} group`}
                              >
                                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${isEventLesson ? 'bg-emerald-600 text-white shadow-sm' : isSpecialLesson ? 'bg-blue-600 text-white shadow-sm' : 'bg-emerald-200 text-emerald-800'}`}>{lesson.lessonNumber}</span>
                                <div className="flex-1 min-w-0">
                                  <span className={`text-xs font-bold truncate block ${eventTextClass}`}>
                                    {isEventLesson && <span className="mr-0.5">🎯</span>}
                                    {isSpecialLesson && <span className="mr-0.5">🏆</span>}
                                    {lesson.subject}
                                  </span>
                                  {lessonMarkInfo?.comment && (
                                    <span className="text-[10px] text-gray-500 truncate block" title={lessonMarkInfo.comment}>
                                      💬 {lessonMarkInfo.comment}
                                    </span>
                                  )}
                                </div>
                                {lessonMarkType && (
                                  <span className="text-xs shrink-0" title={getLessonMarkLabel(lessonMarkType)}>
                                    {lessonMarkType === 'test' && '📝'}
                                    {lessonMarkType === 'independent' && '✏️'}
                                    {lessonMarkType === 'key-event' && '⭐'}
                                  </span>
                                )}
                                {canEditSchedule() && (
                                  <button
                                    onClick={() => openLessonEditModal(day.name, lesson.lessonNumber, lessonKey, lesson.subject, dayDate)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-emerald-200 rounded shrink-0"
                                    title="Изменить урок"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              );
                            })
                          )}
                          {/* Кнопка добавления урока */}
                          {canEditSchedule() && (
                            <button
                              onClick={() => openAddLessonModal(day.name, dayDate)}
                              className="w-full mt-2 px-2 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                              Добавить урок
                            </button>
                          )}
                        </div>
                      )}
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

        {activeSection === "allgrades" && (() => {
          const groupedBySubject: Record<string, { q1: typeof grades; q2: typeof grades; q3: typeof grades; q4: typeof grades; all: typeof grades }> = {};
          const getQuarterByDate = (d: string): string => {
            const m = new Date(d).getMonth() + 1;
            const day = new Date(d).getDate();
            if ((m === 9) || (m === 10 && day <= 27)) return '1';
            if ((m === 10 && day >= 28) || (m === 11 && day <= 3)) return '1';
            if ((m === 11 && day >= 4) || (m === 12 && day <= 24)) return '2';
            if ((m === 12 && day >= 25) || (m === 1 && day <= 8)) return '2';
            if ((m === 1 && day >= 9) || m === 2 || (m === 3 && day <= 23)) return '3';
            if ((m === 3 && day >= 24 && day <= 30)) return '3';
            if ((m === 3 && day >= 31) || m === 4 || m === 5) return '4';
            return '1';
          };
          const sorted = [...grades].filter(g => g.date).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
          for (const g of sorted) {
            const subj = g.subjectName || 'Без предмета';
            if (!groupedBySubject[subj]) groupedBySubject[subj] = { q1: [], q2: [], q3: [], q4: [], all: [] };
            const q = g.date ? getQuarterByDate(g.date as string) : '1';
            groupedBySubject[subj][`q${q}` as keyof typeof groupedBySubject[string]].push(g);
            groupedBySubject[subj].all.push(g);
          }
          const canDelete = effectiveUserRole === "admin" || effectiveUserRole === "principal" || isHomeroomTeacher;
          const [deletingGradeId, setDeletingGradeId] = useState<number | null>(null);
          const [confirmClear, setConfirmClear] = useState<string | null>(null);
          const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

          const handleDeleteGrade = async (gradeId: number) => {
            try {
              const res = await fetch(`/api/grades/${gradeId}`, { method: "DELETE" });
              if (res.ok) { setDeletingGradeId(null); window.location.reload(); }
            } catch {}
          };
          const handleClearAll = async () => {
            try {
              await Promise.all(grades.map(g => fetch(`/api/grades/${g.id}`, { method: "DELETE" })));
              setConfirmClear(null); window.location.reload();
            } catch {}
          };

          return (
            <div className="p-3 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">📈 Все оценки</h2>
                {canDelete && grades.length > 0 && (
                  <button onClick={() => setConfirmClear("all")} className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-all border border-red-200 dark:border-red-700">
                    🗑 Очистить все
                  </button>
                )}
              </div>
              {grades.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 font-medium">Оценок пока нет</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedBySubject).map(([subjectName, qGrades]) => {
                    const totalGrades = Object.values(qGrades).slice(0, 4).flat().length;
                    const avg = (subjGrades: typeof grades) => {
                      const nums = subjGrades.map(g => Number(g.value)).filter(n => !isNaN(n));
                      return nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null;
                    };
                    const allNums = qGrades.all.map(g => Number(g.value)).filter(n => !isNaN(n));
                    const totalAvg = allNums.length ? (allNums.reduce((a, b) => a + b, 0) / allNums.length).toFixed(2) : null;
                    return (
                      <details key={subjectName} className="bg-white dark:bg-[#1e1e2e] rounded-xl border border-emerald-200 dark:border-emerald-800 overflow-hidden group" open={expandedSubject === subjectName} onToggle={(e) => setExpandedSubject(e.currentTarget.open ? subjectName : null)}>
                        <summary className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-emerald-200 dark:border-emerald-800 cursor-pointer hover:from-emerald-100 dark:hover:from-emerald-900/30 transition-all flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">{subjectName}</span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full font-semibold">{totalGrades} оценок</span>
                            {totalAvg && <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">Ø {totalAvg}</span>}
                          </div>
                          {canDelete && <button onClick={(e) => { e.stopPropagation(); setConfirmClear(subjectName); }} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium opacity-0 group-open:opacity-100 transition-opacity">Очистить</button>}
                        </summary>
                        <div className="p-4 space-y-4">
                          {['1','2','3','4'].map(q => {
                            const qg = qGrades[`q${q}` as keyof typeof qGrades] as typeof grades;
                            const qAvg = avg(qg);
                            const qLabel = q === '1' ? 'I' : q === '2' ? 'II' : q === '3' ? 'III' : 'IV';
                            return (
                              <div key={q}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">{qLabel} четверть</span>
                                  {qAvg && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Средний: {qAvg}</span>}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {qg.length === 0 ? (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">Нет оценок</span>
                                  ) : qg.map(g => {
                                    const val = Number(g.value);
                                    const color = isNaN(val) ? 'bg-gray-200 text-gray-600' : val >= 9 ? 'bg-emerald-500 text-white' : val >= 7 ? 'bg-blue-500 text-white' : val >= 5 ? 'bg-yellow-500 text-white' : val >= 4 ? 'bg-orange-500 text-white' : 'bg-red-500 text-white';
                                    return (
                                      <div key={g.id} className="relative group/grade">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-extrabold shadow-sm ${color}`}>
                                          {g.value}
                                        </span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 dark:bg-gray-900 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover/grade:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                          {g.date} {g.comment ? `• ${g.comment}` : ''}
                                          {canDelete && <button onClick={() => setDeletingGradeId(g.id)} className="ml-2 text-red-300 hover:text-red-100">✕</button>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
              {deletingGradeId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeletingGradeId(null)}>
                  <div className="bg-white dark:bg-[#1e1e2e] rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Удалить оценку?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Это действие нельзя отменить.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setDeletingGradeId(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Отмена</button>
                      <button onClick={() => handleDeleteGrade(deletingGradeId)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all">Удалить</button>
                    </div>
                  </div>
                </div>
              )}
              {confirmClear !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmClear(null)}>
                  <div className="bg-white dark:bg-[#1e1e2e] rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Очистить {confirmClear === "all" ? "все оценки" : `оценки по "${confirmClear}"`}?</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Это удалит {confirmClear === "all" ? `${grades.length} оценок` : 'все оценки этого предмета'}. Отменить нельзя.</p>
                    <div className="flex gap-3">
                      <button onClick={() => setConfirmClear(null)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Отмена</button>
                      <button onClick={confirmClear === "all" ? handleClearAll : async() => { await Promise.all(grades.filter(g => g.subjectName === confirmClear).map(g => fetch(`/api/grades/${g.id}`, { method: "DELETE" }))); setConfirmClear(null); window.location.reload(); }} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all">Удалить</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Предметы */}
        {activeSection === "subjects" && (() => {
          const teacherSubjectNames = new Set<string>();
          if ((effectiveUserRole === "teacher" || isHomeroomTeacher) && currentUserName) {
            schedule.forEach(lesson => {
              if (lesson.teacherName === currentUserName && lesson.subjectName) {
                teacherSubjectNames.add(lesson.subjectName);
              }
            });
            data.subjects.forEach(s => {
              if (s.teacher && s.teacher.trim().toLowerCase() === currentUserName.trim().toLowerCase()) {
                teacherSubjectNames.add(s.name);
              }
            });
          }
          return (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-emerald-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">📚</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Учебные предметы и учителя</h2>
              {canEditInstitution() && <p className="text-xs text-emerald-600 mt-2">💡 Предметы указываются в фильтре предметов для классов (Админ → Предметы → Фильтр по классу)</p>}
              {teacherSubjectNames.size > 0 && <p className="text-xs text-amber-600 mt-1">⭐ Выделены ваши предметы</p>}
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
                  {data.subjects.length > 0 ? data.subjects.map((subject, i) => {
                    const isMySubject = teacherSubjectNames.has(subject.name);
                    return (
                      <tr key={i} className={`${isMySubject ? 'bg-amber-50' : i % 2 === 0 ? 'bg-white' : 'bg-emerald-50'}`}>
                        <td className={`border border-emerald-200 p-3 ${isMySubject ? 'border-l-4 border-l-amber-400' : ''}`}>
                          <span className={`font-bold ${isMySubject ? 'text-amber-700' : 'text-gray-800'}`}>
                            {isMySubject && <span className="mr-1">⭐</span>}
                            {subject.name}
                          </span>
                        </td>
                        <td className={`border border-emerald-200 p-3 ${isMySubject ? 'border-l-4 border-l-amber-400' : ''}`}>
                          <span className={`font-bold ${isMySubject ? 'text-amber-700' : 'text-gray-800'}`}>{subject.teacher || ""}</span>
                        </td>
                      </tr>
                    );
                  }) : (
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
          );
        })()}

        {/* Сведения */}
        {activeSection === "summary" && (() => {
            const monthNames = ["Сентябрь", "Октябрь", "Ноябрь", "Декабрь", "Январь", "Февраль", "Март", "Апрель", "Май"];
            const monthNumbers = [8, 9, 10, 11, 0, 1, 2, 3, 4];
            const shortDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
            const academicYear = sharedData.academicYear || getCurrentAcademicYear();
            const yearParts = academicYear.split('/');
            const startYear = parseInt(yearParts[0]) || new Date().getFullYear();

            const getMonthDates = (monthIdx: number) => {
              const year = monthIdx <= 3 ? startYear : startYear + 1;
              const month = monthNumbers[monthIdx];
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const firstDay = new Date(year, month, 1).getDay();
              const offset = firstDay === 0 ? 5 : firstDay - 1;
              const dates: { date: Date; day: number; dayOfWeek: number; isWeekend: boolean }[] = [];
              for (let d = 1; d <= daysInMonth; d++) {
                const dt = new Date(year, month, d);
                const dow = dt.getDay();
                dates.push({ date: dt, day: d, dayOfWeek: dow, isWeekend: dow === 0 || dow === 6 });
              }
              return { dates, offset, year };
            };

            const getDayInfo = (date: Date) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayNameRu = DAYS_OF_WEEK.find(d => d.dayOfWeek === date.getDay())?.name || '';
              const dayLessons = dayNameRu ? getDayLessons(selectedQuarter, dayNameRu, date) : [];
              const dayGrades = grades.filter(g => g.date && g.date.startsWith(dateStr));
              const holidayName = getHolidayNameByDate(date);
              const celebration = getHolidayByDate(date, disabledHolidays);
              const marksForDay: string[] = [];
              dayLessons.forEach(lesson => {
                const markInfo = getLessonMark(dayNameRu, lesson.lessonNumber);
                if (markInfo?.type) marksForDay.push(markInfo.type);
              });
              return { dayLessons, dayGrades, marksForDay, holidayName, celebration };
            };

            const formatMonthIdx = (quarter: string): number[] => {
              if (quarter === '1') return [0, 1, 2];
              if (quarter === '2') return [2, 3, 4];
              if (quarter === '3') return [4, 5, 6];
              return [6, 7, 8];
            };

            const getQuarterForMonth = (mIdx: number) => {
              if (mIdx <= 1) return '1';
              if (mIdx <= 3) return '2';
              if (mIdx <= 5) return '3';
              return '4';
            };

            const isCurrentMonth = (mIdx: number) => {
              const cm = new Date().getMonth();
              return monthNumbers[mIdx] === cm;
            };

            const { dates, offset, year } = getMonthDates(viewMonthIdx);
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const isToday = (date: Date) => date.toISOString().split('T')[0] === todayStr;

            return (
              <div className="p-4">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white p-5 rounded-xl shadow-lg mb-4">
                  <div className="flex justify-between items-center">
                    <button onClick={() => { const newIdx = Math.max(0, viewMonthIdx - 1); setViewMonthIdx(newIdx); setSelectedQuarter(getQuarterForMonth(newIdx)); }} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg font-bold transition-colors">‹</button>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold">{monthNames[viewMonthIdx]} {year}</h2>
                      <div className="flex gap-1.5 justify-center mt-1">
                        {['1', '2', '3', '4'].map(q => (
                          <button
                            key={q}
                            onClick={() => {
                              setSelectedQuarter(q);
                              const qMonths = formatMonthIdx(q);
                              setViewMonthIdx(qMonths[1]);
                              setSelectedWeek(getApproxStartOfWeekForQuarter(q, academicYear));
                            }}
                            className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${selectedQuarter === q ? 'bg-white text-indigo-600 shadow' : 'bg-white/20 hover:bg-white/30'}`}
                          >
                            {q === '1' ? 'I' : q === '2' ? 'II' : q === '3' ? 'III' : 'IV'} чет.
                          </button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => { const newIdx = Math.min(8, viewMonthIdx + 1); setViewMonthIdx(newIdx); setSelectedQuarter(getQuarterForMonth(newIdx)); }} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-lg font-bold transition-colors">›</button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 justify-center">
                  {formatMonthIdx(selectedQuarter).map(mIdx => (
                    <button
                      key={mIdx}
                      onClick={() => { setViewMonthIdx(mIdx); setSelectedQuarter(getQuarterForMonth(mIdx)); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        viewMonthIdx === mIdx
                          ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                          : isCurrentMonth(mIdx)
                            ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300 hover:bg-indigo-100'
                            : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {monthNames[mIdx]}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden mb-4">
                  <div className="grid grid-cols-6 gap-px bg-indigo-100">
                    {shortDays.map(d => (
                      <div key={d} className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-center py-2 text-xs font-bold">{d}</div>
                    ))}
                    {Array.from({ length: offset }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-gray-50 p-2 min-h-[70px]" />
                    ))}
                    {dates.map(({ date, day, isWeekend }) => {
                      const info = getDayInfo(date);
                      const hasC = info.marksForDay.includes('test');
                      const hasS = info.marksForDay.includes('independent');
                      const hasK = info.marksForDay.includes('key-event');
                      const hasGr = info.dayGrades.length > 0;
                      const hasLess = info.dayLessons.length > 0;
                      const isH = info.holidayName !== null;
                      const todayHl = isToday(date);

                      if (isH || isWeekend) {
                        return (
                          <div key={day} className={`p-1.5 min-h-[70px] ${isWeekend ? 'bg-gray-100' : 'bg-sky-50'} ${todayHl ? 'ring-2 ring-indigo-400' : ''}`}>
                            <div className={`text-xs font-bold ${isWeekend ? 'text-gray-400' : 'text-sky-700'}`}>{day}</div>
                            {isH && <div className="text-[9px] text-sky-600 leading-tight mt-0.5 line-clamp-2">{info.holidayName}</div>}
                          </div>
                        );
                      }

                      return (
                        <div key={day} className={`p-1.5 min-h-[70px] ${todayHl ? 'bg-amber-50 ring-2 ring-amber-400' : 'bg-white hover:bg-indigo-50'} transition-colors cursor-default`}>
                          <div className={`text-xs font-bold ${todayHl ? 'text-amber-700' : 'text-gray-700'}`}>{day}</div>
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {hasC && <span className="inline-block text-[10px] px-1 py-0 leading-tight rounded bg-red-100 text-red-700 font-bold" title="Контрольная">К</span>}
                            {hasS && <span className="inline-block text-[10px] px-1 py-0 leading-tight rounded bg-blue-100 text-blue-700 font-bold" title="Самостоятельная">С</span>}
                            {hasK && <span className="inline-block text-[10px] px-1 py-0 leading-tight rounded bg-purple-100 text-purple-700 font-bold" title="Ключевое событие">★</span>}
                            {hasGr && <span className="inline-block text-[10px] px-1 py-0 leading-tight rounded bg-emerald-100 text-emerald-700 font-bold" title="Оценка">📊</span>}
                            {hasLess && !hasC && !hasS && !hasK && !hasGr && <span className="inline-block text-[10px] px-1 py-0 leading-tight rounded bg-gray-100 text-gray-500" title="Уроки">📖</span>}
                            {info.celebration?.name && <span className="inline-block text-[10px] px-1 py-0 leading-tight rounded bg-amber-100 text-amber-700 font-bold" title={info.celebration.name}>🎉</span>}
                          </div>
                          {hasGr && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {info.dayGrades.slice(0, 3).map((g, gi) => (
                                <span key={gi} className="text-[10px] font-bold text-emerald-700">{g.value}</span>
                              ))}
                              {info.dayGrades.length > 3 && <span className="text-[10px] text-gray-400">+{info.dayGrades.length - 3}</span>}
                            </div>
                          )}
                          {info.dayLessons.length > 0 && (
                            <div className="text-[9px] text-gray-500 mt-0.5 line-clamp-1">
                              {info.dayLessons.slice(0, 2).map(l => l.subject).join(', ')}
                              {info.dayLessons.length > 2 && ` +${info.dayLessons.length - 2}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center mb-4 text-[11px]">
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block"></span><span className="text-gray-600 font-medium">Контрольная</span></div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block"></span><span className="text-gray-600 font-medium">Самостоятельная</span></div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-100 border border-purple-300 inline-block"></span><span className="text-gray-600 font-medium">Ключ. событие</span></div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block"></span><span className="text-gray-600 font-medium">Оценка</span></div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-50 border border-sky-200 inline-block"></span><span className="text-gray-600 font-medium">Каникулы</span></div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-200 p-4">
                  <h3 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    Сведения за {monthNames[viewMonthIdx]}
                  </h3>
                  <div className="space-y-2">
                    {dates.filter(({ date, isWeekend }) => {
                      if (isWeekend) return false;
                      const info = getDayInfo(date);
                      return info.holidayName !== null || info.celebration?.name || info.marksForDay.length > 0 || info.dayGrades.length > 0 || info.dayLessons.length > 0;
                    }).map(({ date, day }) => {
                      const info = getDayInfo(date);
                      const isH = info.holidayName !== null;
                      if (isH) {
                        return (
                          <div key={day} className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-lg border border-sky-200">
                            <span className="text-xs font-bold text-gray-500 w-6 shrink-0">{day}</span>
                            <span className="text-xs font-medium text-sky-700">{info.holidayName}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={day} className={`flex items-start gap-2 px-3 py-1.5 rounded-lg border ${isToday(date) ? 'bg-amber-50 border-amber-200' : 'bg-white border-indigo-100'}`}>
                          <span className={`text-xs font-bold ${isToday(date) ? 'text-amber-700' : 'text-gray-500'} w-6 shrink-0 pt-0.5`}>{day}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap gap-1">
                              {info.celebration?.name && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">🎉 {info.celebration.name}</span>}
                              {info.marksForDay.map((m, mi) => (
                                <span key={mi} className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${m === 'test' ? 'bg-red-100 text-red-700' : m === 'independent' ? 'bg-blue-100 text-blue-700' : m === 'key-event' ? 'bg-purple-100 text-purple-700' : ''}`}>
                                  {m === 'test' ? '📝 Контрольная' : m === 'independent' ? '✏️ Самост.' : m === 'key-event' ? '⭐ Ключ. событие' : m}
                                </span>
                              ))}
                              {info.dayGrades.length > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                                  📊 {info.dayGrades.map(g => `${g.subjectName || '?'}: ${g.value}`).join(', ')}
                                </span>
                              )}
                              {info.dayLessons.length > 0 && info.marksForDay.length === 0 && info.dayGrades.length === 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                  📖 {info.dayLessons.map(l => l.subject).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {dates.filter(({ date, isWeekend }) => {
                      if (isWeekend) return false;
                      const info = getDayInfo(date);
                      return info.holidayName !== null || info.celebration?.name || info.marksForDay.length > 0 || info.dayGrades.length > 0 || info.dayLessons.length > 0;
                    }).length === 0 && (
                      <div className="text-center text-sm text-gray-400 py-4">Нет данных за этот месяц</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* Аттестация */}
        {activeSection === "grades" && (
          <div className="p-3 md:p-8 bg-gradient-to-b from-rose-50/50 to-white">
            <div className="text-center mb-4 md:mb-8">
              <div className="text-3xl md:text-4xl mb-2">📊</div>
              <h2 className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">Сведения о результатах аттестации</h2>
            </div>

            {/* Подтверждение четвертей */}
            <div className="mb-6 bg-white rounded-2xl shadow-lg p-4 border border-rose-100">
              <h3 className="text-sm font-bold text-rose-700 mb-3">📋 Подтверждение четвертей</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["1", "2", "3", "4"].map((q) => {
                  const conf = quarterConfirmations[q];
                  const isTeacherConfirmed = !!conf?.confirmedByTeacher;
                  const isParentConfirmed = !!conf?.confirmedByParent;
                  return (
                    <div key={q} className={`rounded-xl p-3 border-2 text-center transition-all ${isTeacherConfirmed && isParentConfirmed ? 'border-green-300 bg-green-50' : isTeacherConfirmed ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="text-lg font-bold text-gray-800">{q} четверть</div>
                      <div className="mt-2 space-y-1.5">
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${isTeacherConfirmed ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {isTeacherConfirmed ? `✓ ${conf.confirmedByTeacher}` : 'Кл. руководитель'}
                        </div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${isParentConfirmed ? 'bg-green-500 text-white' : isTeacherConfirmed ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-500'}`}>
                          {isParentConfirmed ? `✓ ${conf?.confirmedByParent}` : isTeacherConfirmed ? 'Ожидает родителя' : 'Ожидает учителя'}
                        </div>
                      </div>
                      {(isHomeroomTeacher || effectiveUserRole === "admin") && !isTeacherConfirmed && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/quarter-confirm", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ groupId: studentGroupId, quarter: parseInt(q), academicYear: getCurrentAcademicYear(), confirmType: "teacher" }),
                              });
                              if (res.ok) {
                                const map = { ...quarterConfirmations };
                                map[q] = { ...map[q], confirmedByTeacher: currentUserName || "Учитель", confirmedByTeacherAt: new Date().toISOString() };
                                setQuarterConfirmations(map);
                              }
                            } catch {}
                          }}
                          className="mt-2 w-full px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all"
                        >
                          Подтвердить
                        </button>
                      )}
                      {isParent && isTeacherConfirmed && !isParentConfirmed && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/quarter-confirm", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ groupId: studentGroupId, quarter: parseInt(q), academicYear: getCurrentAcademicYear(), confirmType: "parent" }),
                              });
                              if (res.ok) {
                                const map = { ...quarterConfirmations };
                                map[q] = { ...map[q], confirmedByParent: currentUserName || "Родитель", confirmedByParentAt: new Date().toISOString() };
                                setQuarterConfirmations(map);
                              }
                            } catch {}
                          }}
                          className="mt-2 w-full px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-all"
                        >
                          Ознакомиться
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {isParent && (
                <p className="text-xs text-gray-500 mt-2">⚠️ Родитель может ознакомиться с четвертью только после подтверждения классным руководителем</p>
              )}
            </div>

            {/* Тип оценок по предметам */}
            {canEditInstitution() && (
              <div className="mb-6 bg-white rounded-2xl shadow-lg p-4 border border-rose-100">
                <h3 className="text-sm font-bold text-rose-700 mb-3">⚙️ Тип оценок по предметам</h3>
                <p className="text-xs text-gray-500 mb-3">Отметьте предметы с зачётной системой оценок (зачёт/незачёт вместо числовых)</p>
                <div className="flex flex-wrap gap-2">
                   {data.subjects.map((subj, i) => {
                    return (
                    <button
                      key={i}
                      type="button"
                      onClick={async () => {
                        const newSubjects = [...data.subjects];
                        const current = newSubjects[i].gradeType || 'numeric';
                        const newGradeType = (current === 'numeric' ? 'passfail' : 'numeric') as 'numeric' | 'passfail';
                        newSubjects[i] = { 
                          ...newSubjects[i], 
                          gradeType: newGradeType 
                        };
                        setData(prev => ({ ...prev, subjects: newSubjects }));
                        // Не сохраняем subjects в localStorage больше
                        const existingGrade = data.grades.find(g => g.subject === subj.name);
                        const payload = {
                          studentId,
                          subjectName: subj.name,
                          academicYear: data.academicYear || getCurrentAcademicYear(),
                          gradeType: newGradeType,
                          q1: existingGrade?.q1 || '',
                          q2: existingGrade?.q2 || '',
                          q3: existingGrade?.q3 || '',
                          q4: existingGrade?.q4 || '',
                          year: existingGrade?.year || '',
                          exam: existingGrade?.exam || '',
                          final: existingGrade?.final || '',
                        };
                        try {
                          const res = await fetch('/api/final-grades', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                          });
                          const result = await res.json();
                          if (!res.ok) {
                            console.error('Ошибка сохранения типа оценок:', result);
                          } else {
                            // Обновляем grades в data, чтобы gradeType сохранился
                            setData(prev => {
                              const existingGradeIndex = prev.grades.findIndex(g => g.subject === subj.name);
                              let newGrades;
                              if (existingGradeIndex >= 0) {
                                // Обновляем существующую запись
                                newGrades = [...prev.grades];
                                newGrades[existingGradeIndex] = {
                                  ...newGrades[existingGradeIndex],
                                  gradeType: newGradeType
                                };
                              } else {
                                // Создаем новую запись
                                newGrades = [...prev.grades, {
                                  subject: subj.name,
                                  q1: '', q2: '', q3: '', q4: '',
                                  year: '', exam: '', final: '',
                                  gradeType: newGradeType
                                }];
                              }
                              return { ...prev, grades: newGrades };
                            });
                          }
                        } catch (err) {
                          console.error('Ошибка сети при сохранении типа оценок:', err);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        (subj.gradeType || 'numeric') === 'passfail'
                          ? 'bg-amber-100 text-amber-800 border-2 border-amber-400'
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:border-rose-300'
                      }`}
                     >
                        {subj.name} {(subj.gradeType || 'numeric') === 'passfail' ? '(зачёт)' : '(балл)'}
                    </button>
                  )})}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg mb-8 border border-rose-100 overflow-x-auto">
              <table className="w-full text-xs table-fixed" style={{ minWidth: '700px' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-t-2xl">
                    <th className="border border-rose-400 px-2 py-2 text-left font-bold" style={{ width: '30%' }}>📖 Учебный предмет</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold" style={{ width: '9%' }}>I</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold" style={{ width: '9%' }}>II</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold" style={{ width: '9%' }}>III</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold" style={{ width: '9%' }}>IV</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold" style={{ width: '11%' }}>Годовая</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold" style={{ width: '11%' }}>Экзамен</th>
                    <th className="border border-rose-400 px-1 py-2 font-bold" style={{ width: '12%' }}>Итоговая</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjects.length > 0 ? data.subjects.map((subj, i) => {
                    const grade = data.grades.find(g => g.subject === subj.name);
                    const isPassFail = (subj.gradeType || (grade?.gradeType)) === 'passfail';
                    const gradeType = isPassFail ? 'passfail' : 'numeric';

                    const calcAutoGrade = (field: 'year' | 'final'): string => {
                      if (!grade) return '';
                      const existing = grade[field];
                      if (existing && existing !== '—' && existing !== '') return existing;
                      
                      if (isPassFail) {
                        const quarters = [grade.q1, grade.q2, grade.q3, grade.q4].filter(v => v && v !== '—' && v !== '');
                        if (field === 'year') {
                          const allPass = quarters.length > 0 && quarters.every(q => q === 'зачёт' || q === 'Зачёт' || q === 'З' || q === 'з');
                          return allPass ? 'Зачёт' : '';
                        }
                        if (field === 'final') {
                          const yearVal = grade.year || calcAutoGrade('year');
                          const examVal = grade.exam;
                          const yPass = yearVal === 'Зачёт' || yearVal === 'зачёт' || yearVal === 'З';
                          const ePass = !examVal || examVal === 'Зачёт' || examVal === 'зачёт' || examVal === 'З' || examVal === '—';
                          return (yPass && ePass) ? 'Зачёт' : '';
                        }
                        return '';
                      }

                      if (field === 'year') {
                        const nums = [grade.q1, grade.q2, grade.q3, grade.q4]
                          .map(v => parseFloat(v))
                          .filter(v => !isNaN(v) && v > 0);
                        if (nums.length === 0) return '';
                        const avg = nums.reduce((a: number, b: number) => a + b, 0) / nums.length;
                        return Math.round(avg * 10) / 10 % 1 === 0 ? String(Math.round(avg)) : (Math.round(avg * 10) / 10).toString();
                      }

                      if (field === 'final') {
                        const yearVal = grade.year || calcAutoGrade('year');
                        const examVal = grade.exam;
                        const yearNum = parseFloat(yearVal);
                        const examNum = parseFloat(examVal);
                        if (!isNaN(yearNum) && !isNaN(examNum) && examVal && examVal !== '—') {
                          const finalAvg = (yearNum + examNum) / 2;
                          return Math.round(finalAvg * 10) / 10 % 1 === 0 ? String(Math.round(finalAvg)) : (Math.round(finalAvg * 10) / 10).toString();
                        }
                        if (!isNaN(yearNum) && isNaN(examNum)) return String(Math.round(yearNum));
                        return yearVal || '';
                      }
                      return '';
                    };

                    const getCellValue = (field: string): string => {
                      if (!grade) return '—';
                      if (field === 'year') {
                        const val = grade.year;
                        return (val && val !== '') ? val : calcAutoGrade('year') || '—';
                      }
                      if (field === 'final') {
                        const val = grade.final;
                        return (val && val !== '') ? val : calcAutoGrade('final') || '—';
                      }
                      return grade[field as keyof typeof grade] || '—';
                    };

                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-rose-50"}>
                        <td className="border border-rose-200 px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-800 font-bold">{subj.name}</span>
                            {isPassFail && <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded font-bold">з/н</span>}
                          </div>
                        </td>
                        {["q1", "q2", "q3", "q4"].map((field) => (
                          <td key={field} className="border border-rose-200 px-1 py-1.5 text-center relative group/cell">
                            {(canEditInstitution() || isHomeroomTeacher) && editingCell && editingCell.subjectIdx === i && editingCell.field === field ? (
                              <input
                                autoFocus
                                className="w-full text-center font-bold text-sm border-2 border-rose-400 rounded px-1 py-0.5 focus:outline-none focus:border-rose-500"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => { if (editingValue.trim()) handleCellEdit(i, field, editingValue.trim()); else setEditingCell(null); }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { if (editingValue.trim()) handleCellEdit(i, field, editingValue.trim()); else setEditingCell(null); } if (e.key === 'Escape') setEditingCell(null); }}
                                placeholder="—"
                              />
                            ) : (
                              <span
                                className={`font-bold cursor-default ${(canEditInstitution() || isHomeroomTeacher) ? 'hover:bg-rose-100 rounded px-1 cursor-pointer' : ''} ${
                                  isPassFail 
                                    ? (getCellValue(field) === 'Зачёт' || getCellValue(field) === 'зачёт' || getCellValue(field) === 'З' ? 'text-emerald-600' : getCellValue(field) === 'Незачёт' || getCellValue(field) === 'незачёт' || getCellValue(field) === 'Н' ? 'text-red-500' : 'text-gray-800')
                                    : 'text-gray-800'
                                }`}
                                onClick={() => { if (canEditInstitution() || isHomeroomTeacher) { setEditingCell({ subjectIdx: i, field }); setEditingValue(getCellValue(field) === '—' ? '' : getCellValue(field)); } }}
                              >{getCellValue(field)}</span>
                            )}
                            {(canEditInstitution() || isHomeroomTeacher) && !(editingCell && editingCell.subjectIdx === i && editingCell.field === field) && (
                              <button
                                onClick={() => { setEditingCell({ subjectIdx: i, field }); setEditingValue(getCellValue(field) === '—' ? '' : getCellValue(field)); }}
                                className="absolute top-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity text-rose-400 hover:text-rose-600"
                                title="Редактировать"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                              </button>
                            )}
                          </td>
                        ))}
                        <td className="border border-rose-200 px-1 py-1.5 text-center bg-rose-50/50 relative group/cell">
                          {(canEditInstitution() || isHomeroomTeacher) && editingCell && editingCell.subjectIdx === i && editingCell.field === "year" ? (
                            <input autoFocus className="w-full text-center font-bold text-sm border-2 border-rose-400 rounded px-1 py-0.5 focus:outline-none focus:border-rose-500" value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onBlur={() => { if (editingValue.trim()) handleCellEdit(i, "year", editingValue.trim()); else setEditingCell(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { if (editingValue.trim()) handleCellEdit(i, "year", editingValue.trim()); else setEditingCell(null); } if (e.key === 'Escape') setEditingCell(null); }} placeholder="—" />
                          ) : (
                            <span className={`font-bold ${(canEditInstitution() || isHomeroomTeacher) ? 'hover:bg-rose-100 rounded px-1 cursor-pointer' : ''} ${
                              isPassFail 
                                ? (getCellValue('year') === 'Зачёт' ? 'text-emerald-600' : getCellValue('year') === 'Незачёт' ? 'text-red-500' : 'text-gray-800')
                                : 'text-rose-700'
                            }`} onClick={() => { if (canEditInstitution() || isHomeroomTeacher) { setEditingCell({ subjectIdx: i, field: "year" }); setEditingValue(getCellValue('year') === '—' ? '' : getCellValue('year')); } }}>{getCellValue('year')}</span>
                          )}
                          {!isPassFail && getCellValue('year') !== '—' && getCellValue('year') !== '' && !(editingCell && editingCell.subjectIdx === i && editingCell.field === "year") && (
                            <span className="block text-[9px] text-rose-400 font-normal">авто</span>
                          )}
                          {(canEditInstitution() || isHomeroomTeacher) && !(editingCell && editingCell.subjectIdx === i && editingCell.field === "year") && (
                            <button onClick={() => { setEditingCell({ subjectIdx: i, field: "year" }); setEditingValue(getCellValue('year') === '—' ? '' : getCellValue('year')); }} className="absolute top-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity text-rose-400 hover:text-rose-600" title="Редактировать"><svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                          )}
                        </td>
                        <td className="border border-rose-200 px-1 py-1.5 text-center bg-rose-50/50 relative group/cell">
                          {(canEditInstitution() || isHomeroomTeacher) && editingCell && editingCell.subjectIdx === i && editingCell.field === "exam" ? (
                            <input autoFocus className="w-full text-center font-bold text-sm border-2 border-rose-400 rounded px-1 py-0.5 focus:outline-none focus:border-rose-500" value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onBlur={() => { if (editingValue.trim()) handleCellEdit(i, "exam", editingValue.trim()); else setEditingCell(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { if (editingValue.trim()) handleCellEdit(i, "exam", editingValue.trim()); else setEditingCell(null); } if (e.key === 'Escape') setEditingCell(null); }} placeholder="—" />
                          ) : (
                            <span className={`font-bold ${(canEditInstitution() || isHomeroomTeacher) ? 'hover:bg-rose-100 rounded px-1 cursor-pointer' : ''} text-gray-800`} onClick={() => { if (canEditInstitution() || isHomeroomTeacher) { setEditingCell({ subjectIdx: i, field: "exam" }); setEditingValue(getCellValue('exam') === '—' ? '' : getCellValue('exam')); } }}>{getCellValue('exam')}</span>
                          )}
                          {(canEditInstitution() || isHomeroomTeacher) && !(editingCell && editingCell.subjectIdx === i && editingCell.field === "exam") && (
                            <button onClick={() => { setEditingCell({ subjectIdx: i, field: "exam" }); setEditingValue(getCellValue('exam') === '—' ? '' : getCellValue('exam')); }} className="absolute top-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity text-rose-400 hover:text-rose-600" title="Редактировать"><svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                          )}
                        </td>
                        <td className="border border-rose-200 px-1 py-1.5 text-center bg-rose-100/50 relative group/cell">
                          {(canEditInstitution() || isHomeroomTeacher) && editingCell && editingCell.subjectIdx === i && editingCell.field === "final" ? (
                            <input autoFocus className="w-full text-center font-bold text-sm border-2 border-rose-400 rounded px-1 py-0.5 focus:outline-none focus:border-rose-500" value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onBlur={() => { if (editingValue.trim()) handleCellEdit(i, "final", editingValue.trim()); else setEditingCell(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { if (editingValue.trim()) handleCellEdit(i, "final", editingValue.trim()); else setEditingCell(null); } if (e.key === 'Escape') setEditingCell(null); }} placeholder="—" />
                          ) : (
                            <span className={`font-bold ${(canEditInstitution() || isHomeroomTeacher) ? 'hover:bg-rose-100 rounded px-1 cursor-pointer' : ''} ${
                              isPassFail 
                                ? (getCellValue('final') === 'Зачёт' ? 'text-emerald-700' : getCellValue('final') === 'Незачёт' ? 'text-red-600' : 'text-gray-800')
                                : 'text-rose-800'
                            }`} onClick={() => { if (canEditInstitution() || isHomeroomTeacher) { setEditingCell({ subjectIdx: i, field: "final" }); setEditingValue(getCellValue('final') === '—' ? '' : getCellValue('final')); } }}>{getCellValue('final')}</span>
                          )}
                          {!isPassFail && getCellValue('final') !== '—' && getCellValue('final') !== '' && !(editingCell && editingCell.subjectIdx === i && editingCell.field === "final") && (
                            <span className="block text-[9px] text-rose-400 font-normal">авто</span>
                          )}
                          {(canEditInstitution() || isHomeroomTeacher) && !(editingCell && editingCell.subjectIdx === i && editingCell.field === "final") && (
                            <button onClick={() => { setEditingCell({ subjectIdx: i, field: "final" }); setEditingValue(getCellValue('final') === '—' ? '' : getCellValue('final')); }} className="absolute top-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 transition-opacity text-rose-400 hover:text-rose-600" title="Редактировать"><svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                          )}
                        </td>
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
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg p-4 md:p-6 border-2 border-emerald-300">
              <h3 className="text-lg md:text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">📋</span>Поведение по четвертям
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q, i) => (
                  <div key={q} className="bg-white rounded-xl p-4 border-2 border-emerald-200">
                    <h4 className="font-bold text-emerald-800 mb-3 text-center text-sm">{i + 1} четв.</h4>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-emerald-50 transition-colors">
                        <input 
                          type="radio" 
                          name={`behavior-${q}`} 
                          checked={data.behavior[q] === 'example'} 
                          onChange={() => updateBehavior(q, 'example')} 
                          className="w-4 h-4 text-emerald-600 accent-emerald-600" 
                        />
                        <span className="text-gray-800 font-semibold">Примерное</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-amber-50 transition-colors">
                        <input 
                          type="radio" 
                          name={`behavior-${q}`} 
                          checked={data.behavior[q] === 'satisfactory'} 
                          onChange={() => updateBehavior(q, 'satisfactory')} 
                          className="w-4 h-4 text-amber-500 accent-amber-500" 
                        />
                        <span className="text-gray-800 font-semibold">Удовлет.</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <input 
                          type="radio" 
                          name={`behavior-${q}`} 
                          checked={data.behavior[q] === 'unsatisfactory'} 
                          onChange={() => updateBehavior(q, 'unsatisfactory')} 
                          className="w-4 h-4 text-red-500 accent-red-500" 
                        />
                        <span className="text-gray-800 font-semibold">Неудовл.</span>
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
          <HolidayCalendarSection 
            sharedData={sharedData}
            setSharedData={setSharedData}
            canEdit={canEditInstitution()}
          />
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

            {/* Форма добавления праздника */}
            {canEditContacts() && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-amber-300 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">➕</span>
                  <h3 className="text-xl font-bold text-amber-800">Добавить праздник</h3>
                </div>
                <div className="grid md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Дата (например: 15 мая)"
                    value={newHolidayForm.date}
                    onChange={(e) => setNewHolidayForm({...newHolidayForm, date: e.target.value})}
                    className="border-2 border-amber-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium bg-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <input
                    type="text"
                    placeholder="Название праздника"
                    value={newHolidayForm.name}
                    onChange={(e) => setNewHolidayForm({...newHolidayForm, name: e.target.value})}
                    className="border-2 border-amber-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium bg-white placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 md:col-span-2"
                  />
                  <select
                    value={newHolidayForm.category}
                    onChange={(e) => setNewHolidayForm({...newHolidayForm, category: e.target.value as HolidayCategory})}
                    className="border-2 border-amber-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  >
                    <option value="state">🎉 Государственный</option>
                    <option value="memorial">🕯️ Памятная дата</option>
                    <option value="professional">💼 Профессиональный</option>
                  </select>
                </div>
                <button
                  onClick={addCustomHoliday}
                  disabled={!newHolidayForm.date || !newHolidayForm.name}
                  className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Добавить праздник
                </button>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🎉</span>
                  <h3 className="text-xl font-bold text-red-800">Государственные праздники</h3>
                  {canEditContacts() && getAllHolidaysByCategory('state').length > 0 && (
                    <span className="text-xs text-gray-500 ml-auto">✕ для удаления</span>
                  )}
                </div>
                <ul className="space-y-3">
                  {HOLIDAYS_LIST.map((holiday, i) => {
                    const holidayKey = `state-${holiday.date}`;
                    const isDisabled = disabledHolidays.has(holidayKey);
                    return (
                      <li key={i} className={`flex gap-3 items-center rounded-lg p-3 shadow-sm transition-all ${isDisabled ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                        {canEditSchedule() && (
                          <button
                            onClick={() => toggleHolidayDisabled(holidayKey)}
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDisabled ? 'bg-gray-300 text-gray-500' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                            title={isDisabled ? 'Праздник не засчитывается как выходной - кликните чтобы включить' : 'Праздник засчитывается как выходной - кликните чтобы отключить'}
                          >
                            <span className="text-lg">{isDisabled ? '🔕' : '📅'}</span>
                          </button>
                        )}
                        <span className="flex-shrink-0 w-20 font-bold text-red-600">{holiday.date}</span>
                        <span className={`flex-1 font-bold ${isDisabled ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{holiday.name}</span>
                      </li>
                    );
                  })}
                  {/* Пользовательские государственные праздники */}
                  {getAllHolidaysByCategory('state').length === 0 && (
                    <li className="text-sm text-gray-400 italic">Нет пользовательских праздников</li>
                  )}
                  {getAllHolidaysByCategory('state').map((holiday) => (
                    <li key={holiday.id} className="flex gap-3 items-start bg-amber-50 rounded-lg p-3 shadow-sm border-2 border-amber-200">
                      <span className="flex-shrink-0 w-24 font-bold text-amber-700">{holiday.date}</span>
                      <span className="text-gray-800 font-bold flex-1">{holiday.name}</span>
                      <button
                        onClick={() => confirmDeleteHoliday(holiday.id, holiday.name)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg leading-none w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all flex-shrink-0"
                        title="Удалить праздник"
                      >
                        ✕
                      </button>
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
                  {MEMORIAL_DATES.map((date, i) => {
                    const holidayKey = `memorial-${date.date}`;
                    const isDisabled = disabledHolidays.has(holidayKey);
                    return (
                      <li key={i} className={`flex gap-3 items-center rounded-lg p-3 shadow-sm overflow-hidden transition-all ${isDisabled ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                        {canEditSchedule() && (
                          <button
                            onClick={() => toggleHolidayDisabled(holidayKey)}
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDisabled ? 'bg-gray-300 text-gray-500' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                            title={isDisabled ? 'Праздник не засчитывается как выходной - кликните чтобы включить' : 'Праздник засчитывается как выходной - кликните чтобы отключить'}
                          >
                            <span className="text-lg">{isDisabled ? '🔕' : '📅'}</span>
                          </button>
                        )}
                        <span className="flex-shrink-0 w-16 sm:w-16 font-bold text-gray-600 text-xs sm:text-sm">{date.date}</span>
                        <span className={`font-bold text-xs sm:text-sm break-words flex-1 min-w-0 leading-snug ${isDisabled ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{date.name}</span>
                      </li>
                    );
                  })}
                  {/* Пользовательские памятные даты */}
                  {getAllHolidaysByCategory('memorial').map((holiday) => (
                    <li key={holiday.id} className="flex gap-3 items-start bg-amber-50 rounded-lg p-3 shadow-sm border-2 border-amber-200">
                      <span className="flex-shrink-0 w-16 sm:w-20 font-bold text-amber-700 text-xs sm:text-sm">{holiday.date}</span>
                      <span className="text-gray-800 font-bold text-xs sm:text-sm break-words flex-1 min-w-0 leading-snug">{holiday.name}</span>
                      <button
                        onClick={() => confirmDeleteHoliday(holiday.id, holiday.name)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg leading-none w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all flex-shrink-0"
                        title="Удалить праздник"
                      >
                        ✕
                      </button>
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
                {PROFESSIONAL_HOLIDAYS.map((holiday, i) => {
                  const holidayKey = `professional-${holiday.date}`;
                  const isDisabled = disabledHolidays.has(holidayKey);
                  return (
                    <li key={i} className={`flex gap-3 items-center rounded-lg p-3 shadow-sm transition-all ${isDisabled ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                      {canEditSchedule() && (
                        <button
                          onClick={() => toggleHolidayDisabled(holidayKey)}
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDisabled ? 'bg-gray-300 text-gray-500' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                          title={isDisabled ? 'Праздник не засчитывается как выходной - кликните чтобы включить' : 'Праздник засчитывается как выходной - кликните чтобы отключить'}
                        >
                          <span className="text-lg">{isDisabled ? '🔕' : '📅'}</span>
                        </button>
                      )}
                      <span className="flex-shrink-0 w-40 font-bold text-emerald-600">{holiday.date}</span>
                      <span className={`flex-1 font-bold ${isDisabled ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{holiday.name}</span>
                    </li>
                  );
                })}
                {/* Пользовательские профессиональные праздники */}
                {getAllHolidaysByCategory('professional').map((holiday) => (
                  <li key={holiday.id} className="flex gap-3 items-start bg-amber-50 rounded-lg p-3 shadow-sm border-2 border-amber-200">
                    <span className="flex-shrink-0 w-48 font-bold text-amber-700">{holiday.date}</span>
                    <span className="text-gray-800 font-bold flex-1">{holiday.name}</span>
                    <button
                      onClick={() => confirmDeleteHoliday(holiday.id, holiday.name)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-lg leading-none w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all flex-shrink-0"
                      title="Удалить праздник"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Модальное окно подтверждения удаления праздника */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 backdrop-blur-md bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🗑️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Подтвердите удаление</h3>
                <p className="text-gray-600">
                  Вы действительно хотите удалить праздник <strong className="text-gray-800">"{holidayToDeleteName}"</strong>?
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={removeCustomHoliday}
                  className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Контекстное меню для уроков */}
        {contextMenu.visible && canEditSchedule() && (
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={closeContextMenu}
            />
            <div
              className="fixed z-[70] bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[220px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-500">{contextMenu.dayName}, урок {contextMenu.lessonNumber}</p>
              </div>

              {/* Обмен уроками */}
              {!swapSource ? (
                <button
                  onClick={() => setSwapSource({ dayName: contextMenu.dayName, lessonNumber: contextMenu.lessonNumber, lessonKey: contextMenu.lessonKey })}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
                >
                  <span>🔄</span>
                  <span>Поменять местами</span>
                </button>
              ) : (
                <>
                  <div className="px-4 py-2 bg-amber-50 text-xs text-amber-700">
                    Выберите урок для обмена с {swapSource.dayName}, {swapSource.lessonNumber}
                  </div>
                  <button
                    onClick={() => swapLessons(contextMenu.dayName, contextMenu.lessonNumber)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors text-emerald-600 font-medium"
                  >
                    <span>✓</span>
                    <span>Обменять с этим уроком</span>
                  </button>
                  <button
                    onClick={() => setSwapSource(null)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors text-red-600"
                  >
                    <span>✕</span>
                    <span>Отменить обмен</span>
                  </button>
                </>
              )}

              <div className="border-t border-gray-100 my-1" />

              {/* Добавить урок */}
              <div className="px-3 py-2">
                <p className="text-xs text-gray-400 mb-1">Добавить:</p>
                <div className="grid grid-cols-2 gap-1">
                  {availableSubjects.slice(0, 6).map(subject => (
                    <button
                      key={subject}
                      onClick={() => addLesson(contextMenu.dayName, contextMenu.lessonNumber, subject)}
                      className="px-2 py-1 text-xs text-left hover:bg-emerald-50 hover:text-emerald-700 rounded transition-colors truncate"
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 my-1" />

              {/* Пометить урок */}
              <div className="px-3 py-2">
                <p className="text-xs text-gray-400 mb-1">Пометить как:</p>
                <button
                  onClick={() => markLesson(contextMenu.dayName, contextMenu.lessonNumber, 'test')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 hover:text-red-700 flex items-center gap-2 rounded transition-colors"
                >
                  <span>📝</span>
                  <span>Контрольная работа</span>
                </button>
                <button
                  onClick={() => markLesson(contextMenu.dayName, contextMenu.lessonNumber, 'independent')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 rounded transition-colors"
                >
                  <span>✏️</span>
                  <span>Самостоятельная работа</span>
                </button>
                <button
                  onClick={() => markLesson(contextMenu.dayName, contextMenu.lessonNumber, 'key-event')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 rounded transition-colors"
                >
                  <span>⭐</span>
                  <span>Ключевое событие</span>
                </button>
                <button
                  onClick={() => markLesson(contextMenu.dayName, contextMenu.lessonNumber, null)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded transition-colors text-gray-500"
                >
                  <span>✗</span>
                  <span>Убрать пометку</span>
                </button>
              </div>

              <div className="border-t border-gray-100 my-1" />

              {/* Убрать урок */}
              <button
                onClick={() => removeLesson(contextMenu.dayName, contextMenu.lessonNumber)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
              >
                <span>🗑️</span>
                <span>Убрать урок</span>
              </button>
            </div>
          </>
        )}

        {/* Модальное окно редактирования урока */}
        {lessonEditModal.visible && canEditSchedule() && (
          <div 
            className="fixed inset-0 backdrop-blur-md bg-black/30 z-[80] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeLessonEditModal(); }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {lessonEditModal.dayName}, урок {lessonEditModal.lessonNumber}
                  </h3>
                  {lessonEditModal.dayDate && (
                    <p className="text-sm text-gray-500">
                      {lessonEditModal.dayDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <button
                  onClick={closeLessonEditModal}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Чекбокс для выбора режима изменения */}
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonEditModal.applyToSingleDay}
                    onChange={(e) => setLessonEditModal(prev => ({ ...prev, applyToSingleDay: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Только на эту дату</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  {lessonEditModal.applyToSingleDay 
                    ? 'Изменение будет применено только к выбранной дате' 
                    : 'Изменение будет применено ко всей четверти'}
                </p>
              </div>

              {/* Сменить предмет */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Изменить предмет:</label>
                <select
                  value={lessonEditModal.currentSubject}
                  onChange={(e) => {
                    updateScheduleItem(
                      selectedQuarter, 
                      lessonEditModal.dayName, 
                      lessonEditModal.lessonNumber - 1, 
                      e.target.value,
                      lessonEditModal.applyToSingleDay ? lessonEditModal.dayDate || undefined : undefined
                    );
                    setLessonEditModal(prev => ({ ...prev, currentSubject: e.target.value }));
                  }}
                  className="w-full border-2 border-emerald-200 rounded-lg px-3 py-2 text-gray-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">— Нет урока —</option>
                  {sortedAvailableSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {eventSubjectNames.includes(subject) ? '🎯 ' : specialSubjectNames.includes(subject) ? '🏆 ' : ''}{subject}
                    </option>
                  ))}
                </select>
              </div>

              {/* Поменять местами */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Обмен с другим уроком:</label>
                {!swapSource ? (
                  <button
                    onClick={() => {
                      setSwapSource({
                        dayName: lessonEditModal.dayName,
                        lessonNumber: lessonEditModal.lessonNumber,
                        lessonKey: lessonEditModal.lessonKey
                      });
                      closeLessonEditModal();
                    }}
                    className="w-full px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>🔄</span>
                    <span>Выбрать урок для обмена</span>
                  </button>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-sm text-emerald-700">Готово к обмену!</p>
                    <button
                      onClick={() => setSwapSource(null)}
                      className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      Отменить обмен
                    </button>
                  </div>
                )}
              </div>

              {/* Пометить урок */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Пометить урок:</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => markLesson(lessonEditModal.dayName, lessonEditModal.lessonNumber, 'test')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      getLessonMarkType(lessonEditModal.dayName, lessonEditModal.lessonNumber) === 'test'
                        ? 'bg-red-500 text-white'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    <span>📝</span>
                    <span>Контрольная работа</span>
                  </button>
                  <button
                    onClick={() => markLesson(lessonEditModal.dayName, lessonEditModal.lessonNumber, 'independent')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      getLessonMarkType(lessonEditModal.dayName, lessonEditModal.lessonNumber) === 'independent'
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    <span>✏️</span>
                    <span>Самостоятельная работа</span>
                  </button>
                  <button
                    onClick={() => markLesson(lessonEditModal.dayName, lessonEditModal.lessonNumber, 'key-event')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      getLessonMarkType(lessonEditModal.dayName, lessonEditModal.lessonNumber) === 'key-event'
                        ? 'bg-purple-500 text-white'
                        : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                    }`}
                  >
                    <span>⭐</span>
                    <span>Ключевое событие</span>
                  </button>
                  <button
                    onClick={() => markLesson(lessonEditModal.dayName, lessonEditModal.lessonNumber, null)}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-2"
                  >
                    <span>✗</span>
                    <span>Убрать пометку</span>
                  </button>
                </div>
              </div>

              {/* Комментарий к уроку */}
              {getLessonMarkType(lessonEditModal.dayName, lessonEditModal.lessonNumber) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий:</label>
                  <textarea
                    value={getLessonMark(lessonEditModal.dayName, lessonEditModal.lessonNumber)?.comment || ''}
                    onChange={(e) => updateLessonComment(lessonEditModal.dayName, lessonEditModal.lessonNumber, e.target.value)}
                    placeholder="Например: тема контрольной, номер варианта..."
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none resize-none"
                    rows={2}
                  />
                </div>
              )}

              {/* Убрать урок */}
              <button
                onClick={() => {
                  removeLesson(lessonEditModal.dayName, lessonEditModal.lessonNumber);
                  closeLessonEditModal();
                }}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <span>🗑️</span>
                <span>Убрать урок</span>
              </button>
            </div>
          </div>
        )}

        {/* Индикатор режима обмена */}
        {swapSource && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg z-[90] flex items-center gap-3">
            <span>🔄</span>
            <span>Режим обмена: выберите урок для обмена с {swapSource.dayName}, урок {swapSource.lessonNumber}</span>
            <button
              onClick={() => setSwapSource(null)}
              className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm"
            >
              Отмена
            </button>
          </div>
        )}

        {/* Модальное окно добавления урока */}
        {addLessonModal.visible && canEditSchedule() && (
          <div 
            className="fixed inset-0 backdrop-blur-md bg-black/30 z-[80] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeAddLessonModal(); }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Добавить урок — {addLessonModal.dayName}
                </h3>
                <button
                  onClick={closeAddLessonModal}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                {addLessonModal.dayDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>

              {/* Выбор номера урока */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Номер урока:</label>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(num => {
                    const existingLesson = Object.entries(scheduleData).find(([key, value]) => {
                      const [q, day, lessonNum] = key.split('-');
                      return q === selectedQuarter && day === addLessonModal.dayName && parseInt(lessonNum) === num - 1;
                    });
                    const isOccupied = !!existingLesson;
                    return (
                      <button
                        key={num}
                        onClick={() => {
                          if (!isOccupied) {
                            const firstSubject = availableSubjects[0];
                            if (firstSubject) {
                              handleAddLessonInDay(addLessonModal.dayName, num, firstSubject);
                              closeAddLessonModal();
                            }
                          }
                        }}
                        disabled={isOccupied}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isOccupied
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {num}
                        {isOccupied && <span className="block text-[10px]">занят</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Выберите свободный номер урока
              </p>
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
