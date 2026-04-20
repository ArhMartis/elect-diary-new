"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  saveDiaryNote, 
  getDiaryNote, 
  verifyDiaryWeek, 
  getDiaryVerification, 
  verifyDiaryByParent, 
  getParentVerification, 
  getDiarySettings, 
  getHomeroomTeacherByGroup, 
  getDirector 
} from "@/app/student/actions";

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
  { date: "Последнее воскресенье января", name: "День белорусской науки" },
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

const SUBJECTS_LIST = [
  "Математика", "Русский язык", "Белорусский язык", "Английский язык", "Физика",
  "Химия", "Биология", "География", "История", "Обществоведение", "Информатика",
  "Физкультура", "Музыка", "ИЗО", "Трудовое обучение", "ОБЖ", "Литература",
  "Алгебра", "Геометрия", "Немецкий язык", "Французский язык", "Польский язык",
  "Черчение", "Экономика", "Право", "Психология", "Астрономия", "Экология"
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
  if ((month === 9 && day >= 1) || month === 10 || (month === 11 && day <= 10)) return '1';
  if ((month === 11 && day > 10) || month === 12 || (month === 1 && day <= 10)) return '2';
  if ((month === 1 && day > 10) || month === 2 || month === 3 || (month === 4 && day <= 10)) return '3';
  if ((month === 4 && day > 10) || month === 5) return '4';
  return '1';
}

function getApproxStartOfWeekForQuarter(quarter: string, academicYear: string): Date {
  const parts = academicYear.split('/');
  const startYear = parts[0] ? parseInt(parts[0]) : new Date().getFullYear();
  const dates: Record<string, Date> = {
    '1': new Date(startYear, 8, 15),
    '2': new Date(startYear, 10, 15),
    '3': new Date(startYear + 1, 1, 15),
    '4': new Date(startYear + 1, 4, 15),
  };
  return getStartOfWeek(dates[quarter] || new Date());
}

// ============================================================================
// LOCALSTORAGE ФУНКЦИИ (Клиентские)
// ============================================================================

function saveDiaryNoteLocal(studentId: string, weekStart: string, note: string): void {
  if (typeof window === 'undefined') return;
  const key = `diary_note_${studentId}_${weekStart}`;
  localStorage.setItem(key, note);
}

function getDiaryNoteLocal(studentId: string, weekStart: string): string {
  if (typeof window === 'undefined') return "";
  const key = `diary_note_${studentId}_${weekStart}`;
  return localStorage.getItem(key) || "";
}

function verifyDiaryWeekLocal(teacherId: string, studentId: string, weekStart: string): { success: boolean } {
  if (typeof window === 'undefined') return { success: false };
  const key = `diary_verification_${studentId}_${weekStart}`;
  localStorage.setItem(key, JSON.stringify({ teacherId, verifiedAt: new Date().toISOString() }));
  return { success: true };
}

function getDiaryVerificationLocal(studentId: string, weekStart: string): { teacherId: string; verifiedAt: Date } | null {
  if (typeof window === 'undefined') return null;
  const key = `diary_verification_${studentId}_${weekStart}`;
  const data = localStorage.getItem(key);
  if (data) {
    const parsed = JSON.parse(data);
    return { teacherId: parsed.teacherId, verifiedAt: new Date(parsed.verifiedAt) };
  }
  return null;
}

function verifyDiaryByParentLocal(parentId: string, studentId: string, weekStart: string): { success: boolean } {
  if (typeof window === 'undefined') return { success: false };
  const key = `diary_parent_verification_${studentId}_${weekStart}`;
  localStorage.setItem(key, JSON.stringify({ parentId, verifiedAt: new Date().toISOString() }));
  return { success: true };
}

function getParentVerificationLocal(studentId: string, weekStart: string): { parentId: string; verifiedAt: Date } | null {
  if (typeof window === 'undefined') return null;
  const key = `diary_parent_verification_${studentId}_${weekStart}`;
  const data = localStorage.getItem(key);
  if (data) {
    const parsed = JSON.parse(data);
    return { parentId: parsed.parentId, verifiedAt: new Date(parsed.verifiedAt) };
  }
  return null;
}

function getDiarySettingsLocal() {
  if (typeof window === 'undefined') return null;
  const key = "diary_settings";
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  }
  return {
    academicYear: "2024/2025",
    schoolName: "Средняя школа №1",
    schoolAddress: "г. Минск, ул. Школьная, 1",
    director: "Иванов Иван Иванович",
    directorPhone: "+375 (17) 123-45-67",
    vicePrincipal: "Петрова Мария Сергеевна",
    vicePrincipalPhone: "+375 (17) 123-45-68",
    vicePrincipalEdu: "Сидоров Алексей Петрович",
    vicePrincipalEduPhone: "+375 (17) 123-45-69",
    homeroomTeacher: "",
    homeroomTeacherPhone: "",
    psychologist: "Козлова Анна Владимировна",
    psychologistPhone: "+375 (17) 123-45-70",
    socialPedagogue: "Новиков Дмитрий Александрович",
    socialPedagoguePhone: "+375 (17) 123-45-71",
    holidays: {
      autumn: "28.10 - 03.11",
      winter: "25.12 - 08.01",
      spring: "24.03 - 30.03",
      summer: "01.06 - 31.08"
    }
  };
}

function saveDiarySettingsLocal(settings: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem("diary_settings", JSON.stringify(settings));
}

function getDirectorLocal() {
  if (typeof window === 'undefined') return null;
  const key = "school_director";
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  }
  return { fullName: "Иванов Иван Иванович", phone: "+375 (17) 123-45-67" };
}

function saveDirectorLocal(director: { fullName: string; phone: string }): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem("school_director", JSON.stringify(director));
}

function getClassScheduleLocal(groupId: number): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const key = `diaryData_class_${groupId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      return parsed.scheduleData || {};
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveClassScheduleLocal(groupId: number, scheduleData: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  const key = `diaryData_class_${groupId}`;
  localStorage.setItem(key, JSON.stringify({ scheduleData }));
}

function getWeeklyAbsenceLocal(studentId: string): Record<string, { absent: string; absentUnexcused: string }> {
  if (typeof window === 'undefined') return {};
  const key = `weekly_absence_${studentId}`;
  const data = localStorage.getItem(key);
  if (data) {
    return JSON.parse(data);
  }
  return {};
}

function saveWeeklyAbsenceLocal(studentId: string, absences: Record<string, { absent: string; absentUnexcused: string }>): void {
  if (typeof window === 'undefined') return;
  const key = `weekly_absence_${studentId}`;
  localStorage.setItem(key, JSON.stringify(absences));
}

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

export default function StudentDiaryPage({
  studentId, studentFullName, studentGrade, studentGroupId, grades, schedule, currentUserId, isHomeroomTeacher = false, isParent = false,
  userRole = "",
  initialDirectorName = "", initialHomeroomTeacherName = "", initialHomeroomTeacherPhone = "",
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
  
  // Общие данные (учреждение)
  const [sharedData, setSharedData] = useState({
    academicYear: "", schoolName: "", schoolAddress: "", institution: "",
    director: initialDirectorName, directorPhone: "",
    vicePrincipal: "", vicePrincipalPhone: "", vicePrincipalEdu: "", vicePrincipalEduPhone: "",
    psychologist: "", psychologistPhone: "", socialPedagogue: "", socialPedagoguePhone: "",
    holidays: { autumn: "", winter: "", spring: "", summer: "" },
  });
  
  // Контакты
  const [contacts, setContacts] = useState({
    director: initialDirectorName, directorPhone: "",
    vicePrincipal: "", vicePrincipalPhone: "", vicePrincipalEdu: "", vicePrincipalEduPhone: "",
    homeroomTeacher: initialHomeroomTeacherName, homeroomTeacherPhone: initialHomeroomTeacherPhone,
    psychologist: "", psychologistPhone: "", socialPedagogue: "", socialPedagoguePhone: "",
  });
  
  const [showNoClassModal, setShowNoClassModal] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<string>(() => getQuarterNumber(new Date()));
  const [scheduleData, setScheduleData] = useState<Record<string, string>>({});
  const [weeklyAbsence, setWeeklyAbsence] = useState<Record<string, { absent: string; absentUnexcused: string }>>({});
  
  // Модальное окно редактирования расписания
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Временный select для тестирования ролей
  const [tempUserRole, setTempUserRole] = useState<string>(userRole);

  // ============================================================================
  // ПРОВЕРКА РОЛЕЙ
  // ============================================================================

  const effectiveUserRole = tempUserRole || userRole;

  const canEditAbsence = useCallback((): boolean => {
    return effectiveUserRole === "admin" || effectiveUserRole === "teacher";
  }, [effectiveUserRole]);

  const canEditSchedule = useCallback((): boolean => {
    return effectiveUserRole === "admin";
  }, [effectiveUserRole]);

  const canEditInstitution = useCallback((): boolean => {
    return effectiveUserRole === "admin";
  }, [effectiveUserRole]);

  const canEditContacts = useCallback((): boolean => {
    return effectiveUserRole === "admin";
  }, [effectiveUserRole]);

  const canVerifyAsTeacher = useCallback((): boolean => {
    return isHomeroomTeacher || effectiveUserRole === "admin" || effectiveUserRole === "homeroomTeacher";
  }, [isHomeroomTeacher, effectiveUserRole]);

  const canVerifyAsParent = useCallback((): boolean => {
    return isParent && teacherVerification !== null;
  }, [isParent, teacherVerification]);

  const isReadOnly = useCallback((): boolean => {
    return effectiveUserRole === "student";
  }, [effectiveUserRole]);

  // ============================================================================
  // РАБОТА С РАСПИСАНИЕМ
  // ============================================================================

  const getScheduleForQuarter = useCallback((quarter: string): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(scheduleData).forEach(([key, value]) => {
      const match = key.match(/^([1-4])-(.+)-(\d+)$/);
      if (match) {
        const [, q, day, num] = match;
        if (q === quarter) result[`${day}-${num}`] = value;
      } else if (quarter === "1" && !key.match(/^[2-4]-/)) {
        result[key] = value;
      }
    });
    return result;
  }, [scheduleData]);

  const quarterSchedule = getScheduleForQuarter(selectedQuarter);

  const updateScheduleItem = (quarter: string, day: string, lessonNum: number, subject: string) => {
    if (!canEditSchedule()) return;
    const key = `${quarter}-${day}-${lessonNum}`;
    const newScheduleData = { ...scheduleData, [key]: subject };
    if (!subject) {
      delete newScheduleData[key];
    }
    setScheduleData(newScheduleData);
    if (studentGroupId) {
      saveClassScheduleLocal(studentGroupId, newScheduleData);
    }
  };

  // ============================================================================
  // ЗАГРУЗКА ДАННЫХ
  // ============================================================================

  useEffect(() => {
    if (isLoaded && studentGrade === "") setShowNoClassModal(true);
  }, [isLoaded, studentGrade]);

  useEffect(() => {
    const loadData = async () => {
      // Загрузка настроек из localStorage
      const settings = getDiarySettingsLocal();
      const academicYear = settings?.academicYear || "";
      const now = new Date();
      const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
      const autoYear = `${startYear}/${startYear + 1}`;
      const finalYear = academicYear || autoYear;

      // Инициализация контактов из localStorage
      const directorData = getDirectorLocal();

      const dbContacts = {
        director: settings?.director || directorData?.fullName || "",
        directorPhone: settings?.directorPhone || directorData?.phone || "",
        vicePrincipal: settings?.vicePrincipal || "",
        vicePrincipalPhone: settings?.vicePrincipalPhone || "",
        vicePrincipalEdu: settings?.vicePrincipalEdu || "",
        vicePrincipalEduPhone: settings?.vicePrincipalEduPhone || "",
        homeroomTeacher: initialHomeroomTeacherName || "",
        homeroomTeacherPhone: initialHomeroomTeacherPhone || "",
        psychologist: settings?.psychologist || "",
        psychologistPhone: settings?.psychologistPhone || "",
        socialPedagogue: settings?.socialPedagogue || "",
        socialPedagoguePhone: settings?.socialPedagoguePhone || "",
      };

      // Загрузка общих данных
      const savedShared = localStorage.getItem("diarySharedData");
      if (savedShared) {
        try {
          const parsed = JSON.parse(savedShared);
          setSharedData({ ...parsed, academicYear: parsed.academicYear || finalYear });
          setContacts({
            director: parsed.director || dbContacts.director,
            directorPhone: parsed.directorPhone || dbContacts.directorPhone,
            vicePrincipal: parsed.vicePrincipal || dbContacts.vicePrincipal,
            vicePrincipalPhone: parsed.vicePrincipalPhone || dbContacts.vicePrincipalPhone,
            vicePrincipalEdu: parsed.vicePrincipalEdu || dbContacts.vicePrincipalEdu,
            vicePrincipalEduPhone: parsed.vicePrincipalEduPhone || dbContacts.vicePrincipalEduPhone,
            homeroomTeacher: parsed.homeroomTeacher || dbContacts.homeroomTeacher,
            homeroomTeacherPhone: parsed.homeroomTeacherPhone || dbContacts.homeroomTeacherPhone,
            psychologist: parsed.psychologist || dbContacts.psychologist,
            psychologistPhone: parsed.psychologistPhone || dbContacts.psychologistPhone,
            socialPedagogue: parsed.socialPedagogue || dbContacts.socialPedagogue,
            socialPedagoguePhone: parsed.socialPedagoguePhone || dbContacts.socialPedagoguePhone,
          });
        } catch (e) { 
          setSharedData(prev => ({ ...prev, academicYear: finalYear })); 
          setContacts(dbContacts); 
        }
      } else {
        setSharedData(prev => ({ 
          ...prev, 
          academicYear: finalYear,
          schoolName: settings?.schoolName || "",
          schoolAddress: settings?.schoolAddress || "",
          institution: settings?.schoolName || "",
          director: dbContacts.director,
          directorPhone: dbContacts.directorPhone,
          vicePrincipal: dbContacts.vicePrincipal,
          vicePrincipalPhone: dbContacts.vicePrincipalPhone,
          vicePrincipalEdu: dbContacts.vicePrincipalEdu,
          vicePrincipalEduPhone: dbContacts.vicePrincipalEduPhone,
          psychologist: dbContacts.psychologist,
          psychologistPhone: dbContacts.psychologistPhone,
          socialPedagogue: dbContacts.socialPedagogue,
          socialPedagoguePhone: dbContacts.socialPedagoguePhone,
          holidays: settings?.holidays || { autumn: "", winter: "", spring: "", summer: "" }
        }));
        setContacts(dbContacts);
      }

      // Загрузка данных ученика
      const saved = localStorage.getItem("diaryData");
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          const defaultContacts = { director: "", directorPhone: "", vicePrincipal: "", vicePrincipalPhone: "", vicePrincipalEdu: "", vicePrincipalEduPhone: "", homeroomTeacher: "", homeroomTeacherPhone: "", psychologist: "", psychologistPhone: "", socialPedagogue: "", socialPedagoguePhone: "" };
          if (!parsedData.contacts) {
            parsedData.contacts = defaultContacts;
          } else {
            parsedData.contacts = { ...defaultContacts, ...parsedData.contacts };
          }
          setData(parsedData);
        } catch (e) { console.error(e); }
      }
      
      // Загрузка расписания класса
      if (studentGroupId) {
        const classSchedule = getClassScheduleLocal(studentGroupId);
        setScheduleData(classSchedule);
      }
      
      // Загрузка пропусков
      const absences = getWeeklyAbsenceLocal(studentId);
      setWeeklyAbsence(absences);
      
      setData(prev => ({ 
        ...prev, 
        surname: studentFullName.split(" ")[0] || "", 
        name: studentFullName.split(" ")[1] || studentFullName, 
        grade: studentGrade 
      }));
      setIsLoaded(true);
    };
    loadData();
  }, [studentFullName, studentGrade, studentGroupId, studentId]);

  // Загрузка заметки
  useEffect(() => {
    const loadNote = async () => {
      const weekStartStr = selectedWeek.toISOString().split("T")[0];
      const savedNote = getDiaryNoteLocal(studentId, weekStartStr);
      setStudentNote(savedNote || "");
    };
    loadNote();
  }, [selectedWeek, studentId]);

  // Загрузка верификаций
  useEffect(() => {
    const loadVerifications = async () => {
      const weekStartStr = selectedWeek.toISOString().split("T")[0];
      setTeacherVerification(getDiaryVerificationLocal(studentId, weekStartStr));
      setParentVerification(getParentVerificationLocal(studentId, weekStartStr));
    };
    loadVerifications();
  }, [selectedWeek, studentId]);

  // ============================================================================
  // ОБРАБОТЧИКИ СОБЫТИЙ
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
    setData(prev => ({ ...prev, behavior: { ...prev.behavior, [quarter]: value } }));
  };

  const updateContact = (field: keyof typeof contacts, value: string) => {
    if (!canEditContacts()) return;
    setContacts(prev => {
      const updated = { ...prev, [field]: value };
      const sharedDataToSave = {
        ...sharedData,
        director: updated.director,
        directorPhone: updated.directorPhone,
        vicePrincipal: updated.vicePrincipal,
        vicePrincipalPhone: updated.vicePrincipalPhone,
        vicePrincipalEdu: updated.vicePrincipalEdu,
        vicePrincipalEduPhone: updated.vicePrincipalEduPhone,
        homeroomTeacher: updated.homeroomTeacher,
        homeroomTeacherPhone: updated.homeroomTeacherPhone,
        psychologist: updated.psychologist,
        psychologistPhone: updated.psychologistPhone,
        socialPedagogue: updated.socialPedagogue,
        socialPedagoguePhone: updated.socialPedagoguePhone,
      };
      localStorage.setItem("diarySharedData", JSON.stringify(sharedDataToSave));
      saveDirectorLocal({ fullName: updated.director, phone: updated.directorPhone });
      return updated;
    });
  };

  const updateSharedData = (field: keyof typeof sharedData, value: string) => {
    if (!canEditInstitution()) return;
    setSharedData(prev => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem("diarySharedData", JSON.stringify(updated));
      saveDiarySettingsLocal({
        academicYear: updated.academicYear,
        schoolName: updated.schoolName || updated.institution,
        schoolAddress: updated.schoolAddress,
        director: contacts.director,
        directorPhone: contacts.directorPhone,
        vicePrincipal: contacts.vicePrincipal,
        vicePrincipalPhone: contacts.vicePrincipalPhone,
        vicePrincipalEdu: contacts.vicePrincipalEdu,
        vicePrincipalEduPhone: contacts.vicePrincipalEduPhone,
        psychologist: contacts.psychologist,
        psychologistPhone: contacts.psychologistPhone,
        socialPedagogue: contacts.socialPedagogue,
        socialPedagoguePhone: contacts.socialPedagoguePhone,
        holidays: updated.holidays
      });
      return updated;
    });
  };

  const updateWeeklyAbsence = (quarter: string, weekNum: number, field: 'absent' | 'absentUnexcused', value: string) => {
    if (!canEditAbsence()) return;
    const weekKey = `Q${quarter}-W${weekNum}`;
    setWeeklyAbsence(prev => {
      const updated = {
        ...prev,
        [weekKey]: { 
          ...prev[weekKey], 
          [field]: value 
        }
      };
      saveWeeklyAbsenceLocal(studentId, updated);
      return updated;
    });
  };

  // Навигация по неделям
  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === "prev" ? -7 : 7));
    if (isDateInAcademicYear(newWeek)) {
      setSelectedWeek(newWeek);
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
  const weekStartOnlyDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
  const weekEndOnlyDate = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
  const weekGrades = grades.filter((g) => {
    if (!g.date) return false;
    const gradeDate = new Date(g.date + "T00:00:00");
    return gradeDate >= weekStartOnlyDate && gradeDate <= weekEndOnlyDate;
  });

  // Секции навигации (одинаковые для всех ролей)
  const sections = [
    { id: "week", label: "Расписание" },
    { id: "title", label: "Титульный лист" },
    { id: "contacts", label: "Контакты" },
    { id: "subjects", label: "Предметы" },
    ...MONTHS.map((m, i) => ({ id: `month-${i}`, label: m })),
    { id: "grades", label: "Аттестация" },
    { id: "holidays", label: "Каникулы" },
    { id: "official", label: "Праздники" },
  ];

  // ============================================================================
  // РЕНДЕРИНГ МОДАЛЬНЫХ ОКОН
  // ============================================================================

  const renderScheduleModal = () => {
    if (!showScheduleModal || !canEditSchedule()) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-emerald-800">
              Редактирование расписания — {selectedQuarter} четверть
            </h2>
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.name} className="border border-emerald-200 rounded-lg p-3">
                <h3 className="font-bold text-emerald-700 mb-2">{day.name}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {Array(8).fill(null).map((_, lessonNum) => {
                    const key = `${selectedQuarter}-${day.name}-${lessonNum}`;
                    const currentValue = scheduleData[key] || "";
                    return (
                      <div key={lessonNum} className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Урок {lessonNum + 1}</label>
                        <select
                          value={currentValue}
                          onChange={(e) => updateScheduleItem(selectedQuarter, day.name, lessonNum, e.target.value)}
                          className="text-xs border border-emerald-300 rounded px-1 py-1"
                        >
                          <option value="">—</option>
                          {SUBJECTS_LIST.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button 
              onClick={() => setShowScheduleModal(false)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 font-sans">
      {/* Временный селектор ролей для тестирования */}
      <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-2 border border-emerald-200">
        <label className="text-xs text-gray-500 block mb-1">Тест: Роль пользователя</label>
        <select 
          value={tempUserRole} 
          onChange={(e) => setTempUserRole(e.target.value)}
          className="text-sm border border-emerald-300 rounded px-2 py-1"
        >
          <option value="">Текущая: {userRole || "не задана"}</option>
          <option value="admin">Администратор</option>
          <option value="teacher">Учитель</option>
          <option value="homeroomTeacher">Классный руководитель</option>
          <option value="parent">Родитель</option>
          <option value="student">Ученик</option>
        </select>
      </div>

      {/* Модальное окно: ученик без класса */}
      {showNoClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

      <div className="max-w-[210mm] mx-auto bg-white shadow-xl my-0 print:my-0 print:shadow-none rounded-xl overflow-hidden pt-0">
        {/* Навигация */}
        <div className="bg-white shadow-md border-b-2 border-emerald-300 px-4 py-3 mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-50">
            {sections.map(section => (
              <button key={section.id} onClick={() => setActiveSection(section.id)} className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium text-sm flex-shrink-0 ${activeSection === section.id ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"}`}>{section.label}</button>
            ))}
          </div>
        </div>

        {/* Титульный лист */}
        {activeSection === "title" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-amber-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">🎓</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">Дневник учащегося</h2>
              <p className="text-gray-500 text-sm">официальный документ</p>
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
                        value={sharedData.academicYear || "20__/20__"} 
                        readOnly={!canEditInstitution()}
                        onChange={(e) => updateSharedData('academicYear', e.target.value)}
                        className={`w-full border-b-2 border-emerald-200 py-2 text-gray-800 ${canEditInstitution() ? 'bg-white' : 'bg-gray-50'}`} 
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">Фамилия:</td>
                    <td className="py-4">
                      <input type="text" value={data.surname} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50" />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">Собственное имя:</td>
                    <td className="py-4">
                      <input type="text" value={data.name} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50" />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">Класс:</td>
                    <td className="py-4">
                      <input type="text" value={data.grade} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50" />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">
                      Наименование учреждения образования:
                      {canEditInstitution() && <span className="block text-xs text-emerald-600 font-normal mt-1">💡 Редактируется администратором</span>}
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
                        className={`w-full border-b-2 border-emerald-200 py-2 text-gray-800 ${canEditInstitution() ? 'bg-white' : 'bg-gray-50'}`} 
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-emerald-50 last:border-0">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">
                      Местонахождение учреждения образования:
                      {canEditInstitution() && <span className="block text-xs text-emerald-600 font-normal mt-1">💡 Редактируется администратором</span>}
                    </td>
                    <td className="py-4">
                      <input 
                        type="text" 
                        value={sharedData.schoolAddress} 
                        readOnly={!canEditInstitution()}
                        onChange={(e) => updateSharedData('schoolAddress', e.target.value)}
                        className={`w-full border-b-2 border-emerald-200 py-2 text-gray-800 ${canEditInstitution() ? 'bg-white' : 'bg-gray-50'}`} 
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
            <div className="text-center mb-10"><div className="text-4xl mb-2">📞</div><h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Контактная информация</h2></div>
            <div className="grid md:grid-cols-2 gap-4 mb-10 items-start">
              {[
                {label: "👔 Руководитель учреждения", field: "director" as const, phoneField: "directorPhone" as const},
                {label: "🍎 Классный руководитель", field: "homeroomTeacher" as const, phoneField: "homeroomTeacherPhone" as const},
                {label: "📚 Заместитель по учебной работе", field: "vicePrincipal" as const, phoneField: "vicePrincipalPhone" as const},
                {label: "🌟 Заместитель по воспитательной работе", field: "vicePrincipalEdu" as const, phoneField: "vicePrincipalEduPhone" as const},
                {label: "🧠 Педагог-психолог", field: "psychologist" as const, phoneField: "psychologistPhone" as const},
                {label: "🤝 Социальный педагог", field: "socialPedagogue" as const, phoneField: "socialPedagoguePhone" as const},
              ].map((contact, i) => (
                <div key={i} className="bg-white border border-violet-100 rounded-xl p-4 shadow-md">
                  <label className="block text-sm font-bold text-violet-700 mb-2">
                    {contact.label}
                    {canEditContacts() && 
                      <span className="block text-xs text-violet-500 font-normal mt-1">💡 Редактируется администратором</span>
                    }
                  </label>
                  <input 
                    type="text" 
                    value={contacts[contact.field]} 
                    readOnly={!canEditContacts()}
                    onChange={(e) => updateContact(contact.field, e.target.value)}
                    className={`w-full border-b-2 border-violet-200 py-2 text-gray-800 mb-3 ${canEditContacts() ? 'bg-white' : 'bg-gray-50'}`} 
                  />
                  <input 
                    type="tel" 
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
                  
                  return (
                    <div key={day.name} className="bg-white border-2 border-emerald-200 rounded-lg p-3">
                      <h4 className="font-bold text-sm text-emerald-900 mb-2">{day.name}</h4>
                      {dayLessons.length === 0 ? 
                        <p className="text-xs text-gray-400 italic">Нет уроков</p> : (
                        <div className="space-y-1">
                          {dayLessons.map(lesson => (
                            <div key={lesson.lessonNumber} className="flex items-center gap-2 p-1.5 bg-emerald-50 rounded">
                              <span className="w-5 h-5 flex items-center justify-center bg-emerald-200 text-emerald-800 rounded-full text-xs font-bold">{lesson.lessonNumber}</span>
                              <span className="text-xs font-medium text-gray-800 truncate">{lesson.subject}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Пропуски по неделям - только для учителей и админа */}
            {canEditAbsence() && (
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Пропуски учебных занятий по неделям
                </h3>
                <p className="text-sm text-orange-700 mb-4">
                  Укажите количество пропущенных уроков для каждой недели.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {["1", "2", "3", "4"].map(quarter => (
                    <div key={quarter} className="bg-white rounded-lg p-3 border border-orange-200">
                      <h4 className="font-bold text-orange-900 mb-2">Четверть {quarter}</h4>
                      {Array(8).fill(null).map((_, weekNum) => {
                        const weekKey = `Q${quarter}-W${weekNum + 1}`;
                        const weekData = weeklyAbsence[weekKey] || { absent: "", absentUnexcused: "" };
                        return (
                          <div key={weekNum} className="flex items-center gap-2 mb-2 text-xs">
                            <span className="font-medium text-gray-700 w-16">Неделя {weekNum + 1}:</span>
                            <input
                              type="number"
                              placeholder="Всего"
                              min="0"
                              value={weekData.absent}
                              onChange={e => updateWeeklyAbsence(quarter, weekNum + 1, 'absent', e.target.value)}
                              className="w-14 border border-gray-300 rounded px-1 py-0.5 text-center"
                              title="Всего пропущено"
                            />
                            <span className="text-gray-400">/</span>
                            <input
                              type="number"
                              placeholder="Неув."
                              min="0"
                              value={weekData.absentUnexcused}
                              onChange={e => updateWeeklyAbsence(quarter, weekNum + 1, 'absentUnexcused', e.target.value)}
                              className="w-14 border border-gray-300 rounded px-1 py-0.5 text-center"
                              title="По неуважительным причинам"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
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
                {/* Классный руководитель */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {teacherVerification ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">Классный руководитель просмотрел</p>
                            <p className="text-xs text-gray-500">{new Date(teacherVerification.verifiedAt).toLocaleDateString("ru-RU")}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 text-sm">Классный руководитель не просмотрел</p>
                          </div>
                        </>
                      )}
                    </div>
                    {canVerifyAsTeacher() && currentUserId && !teacherVerification && (
                      <button 
                        onClick={handleVerify} 
                        disabled={isVerifying} 
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition-all flex-shrink-0"
                      >
                        {isVerifying ? "..." : "Просмотреть"}
                      </button>
                    )}
                  </div>
                </div>
                {/* Родитель */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {parentVerification ? (
                        <>
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">Родитель просмотрел</p>
                            <p className="text-xs text-gray-500">{new Date(parentVerification.verifiedAt).toLocaleDateString("ru-RU")}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 text-sm">Родитель не просмотрел</p>
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
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition-all flex-shrink-0"
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
            <div className="text-center mb-10"><div className="text-4xl mb-2">📐</div><h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Учебные предметы и учителя</h2></div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-10 border border-emerald-100">
              <table className="w-full"><thead><tr className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"><th className="border border-emerald-400 p-4 font-semibold w-1/2">📖 Учебный предмет</th><th className="border border-emerald-400 p-4 font-semibold w-1/2">👨‍🏫 Учитель (ФИО)</th></tr></thead>
                <tbody>{data.subjects.map((subject, i) => (<tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-emerald-50"}><td className="border border-emerald-200 p-3"><input type="text" value={subject.name} readOnly className="w-full text-black font-medium bg-transparent" /></td><td className="border border-emerald-200 p-3"><span className="text-black font-medium">{subject.teacher || "—"}</span></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* Месяцы */}
        {activeSection.startsWith("month-") && (<div className="min-h-[297mm] p-8"><div className="flex items-center gap-4 mb-6"><h2 className="text-2xl font-bold text-green-800">Месяц:</h2><input type="text" value={data.months[parseInt(activeSection.split("-")[1])].name} readOnly className="text-2xl font-bold border-b-2 border-green-800 focus:outline-none w-48 bg-transparent" /></div></div>)}

        {/* Аттестация */}
        {activeSection === "grades" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-rose-50/50 to-white">
            <div className="text-center mb-10"><div className="text-4xl mb-2">📊</div><h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">Сведения о результатах аттестации</h2></div>
            <div className="bg-white rounded-2xl shadow-lg mb-8 border border-rose-100">
              <table className="w-full text-xs table-fixed">
                <thead><tr className="bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-t-2xl"><th className="border border-rose-400 px-2 py-2 text-left font-semibold w-[35%]">📖 Учебный предмет</th><th className="border border-rose-400 px-1 py-2 font-semibold">I</th><th className="border border-rose-400 px-1 py-2 font-semibold">II</th><th className="border border-rose-400 px-1 py-2 font-semibold">III</th><th className="border border-rose-400 px-1 py-2 font-semibold">IV</th><th className="border border-rose-400 px-1 py-2 font-semibold bg-rose-600/50">Годовая</th><th className="border border-rose-400 px-1 py-2 font-semibold bg-rose-600/50">Экзамен</th><th className="border border-rose-400 px-1 py-2 font-semibold bg-rose-600/30">Итоговая</th></tr></thead>
                <tbody>{data.grades.map((grade, i) => (<tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-rose-50"}><td className="border border-rose-200 px-2 py-1.5"><span className="text-black font-medium">{grade.subject}</span></td>{["q1", "q2", "q3", "q4", "year", "exam", "final"].map((field) => (<td key={field} className="border border-rose-200 px-1 py-1.5 text-center"><span className="font-bold text-black">{grade[field as keyof typeof grade] || "—"}</span></td>))}</tr>))}</tbody>
              </table>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg p-6 border-2 border-emerald-300">
              <h3 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2"><span className="text-2xl">📋</span>Поведение по четвертям</h3>
              <div className="grid md:grid-cols-4 gap-4">
                {(['q1', 'q2', 'q3', 'q4'] as const).map((q, i) => (<div key={q} className="bg-white rounded-xl p-4 border-2 border-emerald-200"><h4 className="font-bold text-emerald-800 mb-3 text-center text-sm">{i + 1} четв.</h4><div className="space-y-1 text-xs"><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`behavior-${q}`} checked={data.behavior[q] === 'example'} onChange={() => updateBehavior(q, 'example')} className="w-3 h-3 text-emerald-600" /><span className="text-gray-700">Примерное</span></label><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`behavior-${q}`} checked={data.behavior[q] === 'satisfactory'} onChange={() => updateBehavior(q, 'satisfactory')} className="w-3 h-3 text-emerald-600" /><span className="text-gray-700">Удовлет.</span></label><label className="flex items-center gap-1 cursor-pointer"><input type="radio" name={`behavior-${q}`} checked={data.behavior[q] === 'unsatisfactory'} onChange={() => updateBehavior(q, 'unsatisfactory')} className="w-3 h-3 text-emerald-600" /><span className="text-gray-700">Неудовл.</span></label></div></div>))}
              </div>
            </div>
          </div>
        )}

        {/* Каникулы */}
        {activeSection === "holidays" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-sky-50/50 to-white">
            <div className="text-center mb-10"><div className="text-4xl mb-2">🏖️</div><h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600">Каникулы</h2></div>
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[["🍂 Осенние каникулы", sharedData.holidays.autumn], ["❄️ Зимние каникулы", sharedData.holidays.winter], ["🌸 Весенние каникулы", sharedData.holidays.spring], ["☀️ Летние каникулы", sharedData.holidays.summer]].map(([label, value], i) => (
                <div key={i} className="bg-gradient-to-br from-white to-sky-50 rounded-2xl shadow-lg p-6 border-2 border-sky-200"><label className="block text-lg font-bold text-sky-800 mb-3">{label}</label><p className="text-gray-700 text-lg">{value || "Не указаны"}</p></div>
              ))}
            </div>
          </div>
        )}

        {/* Праздники */}
        {activeSection === "official" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-indigo-50/50 to-white">
            <div className="text-center mb-10">
              <div className="inline-block text-4xl mb-2">🇧🇾</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Государственные праздники и памятные даты</h2>
              <p className="text-gray-700 mt-2 font-bold italic">Республики <span className="text-red-600 font-extrabold text-lg bg-gradient-to-r from-red-600 via-green-600 to-red-600 bg-clip-text text-transparent">БЕЛАРУСЬ</span></p>
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
                      <span className="text-gray-700">{holiday.name}</span>
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
                    <li key={i} className="flex gap-3 items-start bg-white rounded-lg p-3 shadow-sm">
                      <span className="flex-shrink-0 w-24 font-bold text-gray-600">{date.date}</span>
                      <span className="text-gray-700">{date.name}</span>
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
                    <span className="text-gray-700">{holiday.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
