"use client";

import { useState, useEffect, useMemo } from "react";
import { saveDiaryNote, getDiaryNote, verifyDiaryWeek, getDiaryVerification, verifyDiaryByParent, getParentVerification, getDiarySettings, getHomeroomTeacherByGroup, getDirector } from "@/app/student/actions";

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
  teacherFullName?: string;
  initialDirectorName?: string;
  initialHomeroomTeacherName?: string;
  initialHomeroomTeacherPhone?: string;
}

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
  { date: "22 июня", name: "День всенародной памяти жертв Великой Ответственной войны" },
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

const DEFAULT_DATA: DiaryData = {
  academicYear: "", surname: "", name: "", grade: "", schoolName: "", schoolAddress: "",
  subjects: [], electives: [], bellSchedule: [],
  months: MONTHS.map(name => ({ name, days: Array(25).fill(null).map((_, i) => ({ date: "", lessons: Array(8).fill({ subject: "", homework: "", grade: "" }) })), absent: "", absentUnexcused: "" })),
  grades: [],
  behavior: { q1: '', q2: '', q3: '', q4: '' },
  holidays: { autumn: "", winter: "", spring: "", summer: "" },
  contacts: { director: "", directorPhone: "", vicePrincipal: "", vicePrincipalPhone: "", vicePrincipalEdu: "", vicePrincipalEduPhone: "", homeroomTeacher: "", homeroomTeacherPhone: "", psychologist: "", psychologistPhone: "", socialPedagogue: "", socialPedagoguePhone: "" },
};

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

export default function StudentDiaryPage({
  studentId, studentFullName, studentGrade, studentGroupId, grades, schedule, currentUserId, isHomeroomTeacher = false, isParent = false,
  userRole = "",
  initialDirectorName = "", initialHomeroomTeacherName = "", initialHomeroomTeacherPhone = "",
}: StudentDiaryPageProps) {
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
    academicYear: "", schoolName: "", schoolAddress: "", institution: "",
    director: initialDirectorName, directorPhone: "",
    vicePrincipal: "", vicePrincipalPhone: "", vicePrincipalEdu: "", vicePrincipalEduPhone: "",
    psychologist: "", psychologistPhone: "", socialPedagogue: "", socialPedagoguePhone: "",
    holidays: { autumn: "", winter: "", spring: "", summer: "" },
  });
  const [contacts, setContacts] = useState({
    director: initialDirectorName, directorPhone: "",
    vicePrincipal: "", vicePrincipalPhone: "", vicePrincipalEdu: "", vicePrincipalEduPhone: "",
    homeroomTeacher: initialHomeroomTeacherName, homeroomTeacherPhone: initialHomeroomTeacherPhone,
    psychologist: "", psychologistPhone: "", socialPedagogue: "", socialPedagoguePhone: "",
  });
  const [showNoClassModal, setShowNoClassModal] = useState(false);
  
  // Новые функции: оценки, сообщения, фильтры
  const [gradesPanelOpen, setGradesPanelOpen] = useState(false);
  const [gradesSubjectFilter, setGradesSubjectFilter] = useState<string>("ALL");
  const [gradesState, setGradesState] = useState<Grade[]>([]);
  const [messages, setMessages] = useState<{ to: string; text: string; date: string }[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [newGrade, setNewGrade] = useState<{ subject: string; value: string; date: string }>({ subject: "", value: "", date: "" });
  const [messagesPanelOpen, setMessagesPanelOpen] = useState(false);
  const [messageTo, setMessageTo] = useState<string>("");
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [weeklyAbsence, setWeeklyAbsence] = useState<Record<string, { absent: string; absentUnexcused: string }>>({});
  
  const [selectedQuarter, setSelectedQuarter] = useState<string>(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    if ((month === 9 && day >= 1) || month === 10 || (month === 11 && day <= 10)) return '1';
    if ((month === 11 && day > 10) || month === 12 || (month === 1 && day <= 10)) return '2';
    if ((month === 1 && day > 10) || month === 2 || month === 3 || (month === 4 && day <= 10)) return '3';
    if ((month === 4 && day > 10) || month === 5) return '4';
    return '1';
  });
  const [scheduleData, setScheduleData] = useState<Record<string, string>>({});

  const canEditAbsence = (): boolean => {
    if (userRole === "admin") return true;
    if (userRole === "teacher") return !!isHomeroomTeacher;
    return false;
  };

  // Инициализация оценок из пропсов
  useEffect(() => {
    if (grades && grades.length > 0) {
      const normalized: Grade[] = grades.map(g => ({
        id: g.id,
        value: g.value ?? "",
        date: g.date ?? null,
        subjectName: g.subjectName ?? null,
        teacherName: g.teacherName ?? null
      }));
      setGradesState(normalized);
    }
  }, [grades]);

  const scheduleStorageKey = studentGroupId ? `diaryData_class_${studentGroupId}` : null;

  useEffect(() => {
    if (!scheduleStorageKey) return;
    const saved = localStorage.getItem(scheduleStorageKey);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        if (parsedData.scheduleData) {
          const flatSchedule: Record<string, string> = {};
          const sq = parsedData.scheduleData;
          Object.entries(sq).forEach(([quarter, dayData]: [string, any]) => {
            Object.entries(dayData).forEach(([key, value]) => {
              flatSchedule[`${quarter}-${key}`] = value;
            });
          });
          setScheduleData(flatSchedule);
        }
      } catch (e) { console.error(e); }
    }
  }, [scheduleStorageKey]);

  const getScheduleForQuarter = (quarter: string): Record<string, string> => {
    const result: Record<string, string> = {};
    Object.entries(scheduleData).forEach(([key, value]) => {
      const match = key.match(/^([1-4])-(.+)-(\d+)$/);
      if (match) {
        const [, q, day, num] = match;
        if (q === quarter) result[`${day}-${num}`] = value;
      } else if (quarter === "1") {
        result[key] = value;
      }
    });
    return result;
  };

  const quarterSchedule = getScheduleForQuarter(selectedQuarter);

  const getQuarterNumber = (date: Date): string => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if ((month === 9 && day >= 1) || month === 10 || (month === 11 && day <= 10)) return '1';
    if ((month === 11 && day > 10) || month === 12 || (month === 1 && day <= 10)) return '2';
    if ((month === 1 && day > 10) || month === 2 || month === 3 || (month === 4 && day <= 10)) return '3';
    if ((month === 4 && day > 10) || month === 5) return '4';
    return selectedQuarter;
  };

  const getApproxStartOfWeekForQuarter = (quarter: string): Date => {
    const parts = sharedData.academicYear.split('/');
    const startYear = parts[0] ? parseInt(parts[0]) : new Date().getFullYear();
    const dates: Record<string, Date> = {
      '1': new Date(startYear, 8, 15),
      '2': new Date(startYear, 10, 15),
      '3': new Date(startYear + 1, 1, 15),
      '4': new Date(startYear + 1, 4, 15),
    };
    return getStartOfWeek(dates[quarter] || new Date());
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(newWeek.getDate() + (direction === "prev" ? -7 : 7));
    if (isDateInAcademicYear(newWeek)) {
      setSelectedWeek(newWeek);
      setSelectedQuarter(getQuarterNumber(newWeek));
    }
  };

  const isHolidayPeriod = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const parts = dateStr.split(".");
    if (parts.length < 2) return false;
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    if (isNaN(day) || isNaN(month)) return false;
    const date = new Date(new Date().getFullYear(), month - 1, day);
    const periods = [sharedData.holidays.autumn, sharedData.holidays.winter, sharedData.holidays.spring, sharedData.holidays.summer];
    for (const h of periods) {
      if (!h) continue;
      const m = h.match(/(\d{1,2})\.(\d{1,2})\s*[-–—]\s*(\d{1,2})\.(\d{1,2})/);
      if (m) {
        const start = new Date(new Date().getFullYear(), parseInt(m[2]) - 1, parseInt(m[1]));
        const end = new Date(new Date().getFullYear(), parseInt(m[4]) - 1, parseInt(m[3]));
        if (date >= start && date <= end) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (!isLoaded || studentGrade === "") setShowNoClassModal(true);
  }, [isLoaded, studentGrade]);

  const handleLoadData = async () => {
    const settings = await getDiarySettings();
    const academicYear = settings?.academicYear || "";
    const now = new Date();
    const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const autoYear = `${startYear}/${startYear + 1}`;
    const finalYear = academicYear || autoYear;

    const dbContacts = {
      director: settings?.director || "",
      directorPhone: settings?.directorPhone || "",
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

    let directorFromDB = { name: "", phone: "" };
    try {
      const director = await getDirector();
      if (director) directorFromDB = { name: director.fullName || "", phone: "" };
    } catch (e) { console.error("Error loading director:", e); }

    setSharedData(prev => ({
      ...prev,
      academicYear: finalYear,
      schoolName: settings?.schoolName || prev.schoolName,
      schoolAddress: settings?.schoolAddress || prev.schoolAddress,
      director: directorFromDB.name || dbContacts.director,
      directorPhone: directorFromDB.phone || dbContacts.directorPhone,
      holidays: {
        autumn: settings?.holidays_autumn || "",
        winter: settings?.holidays_winter || "",
        spring: settings?.holidays_spring || "",
        summer: settings?.holidays_summer || "",
      },
    }));

    setContacts(prev => ({
      ...prev,
      ...dbContacts,
      director: directorFromDB.name || prev.director,
    }));

    setIsLoaded(true);
  };

  useEffect(() => {
    handleLoadData();
  }, []);

  useEffect(() => {
    if (!studentId) return;
    const loadNote = async () => {
      const note = await getDiaryNote(studentId, selectedWeek.toISOString().split("T")[0]);
      setStudentNote(note || "");
    };
    loadNote();
  }, [selectedWeek, studentId]);

  useEffect(() => {
    const loadVerifications = async () => {
      const weekStartStr = selectedWeek.toISOString().split("T")[0];
      setTeacherVerification(await getDiaryVerification(studentId, weekStartStr));
      setParentVerification(await getParentVerification(studentId, weekStartStr));
    };
    loadVerifications();
  }, [selectedWeek, studentId]);

  const handleSaveNote = async () => {
    await saveDiaryNote(studentId, selectedWeek.toISOString().split("T")[0], studentNote);
  };

  const handleVerify = async () => {
    if (!currentUserId || isVerifying) return;
    setIsVerifying(true);
    const result = await verifyDiaryWeek(currentUserId, studentId, selectedWeek.toISOString().split("T")[0]);
    if (result.success) setTeacherVerification({ teacherId: currentUserId, verifiedAt: new Date() });
    setIsVerifying(false);
  };

  const handleParentVerify = async () => {
    if (!currentUserId || isParentVerifying) return;
    setIsParentVerifying(true);
    const result = await verifyDiaryByParent(currentUserId, studentId, selectedWeek.toISOString().split("T")[0]);
    if (result.success) setParentVerification({ parentId: currentUserId, verifiedAt: new Date() });
    setIsParentVerifying(false);
  };

  const updateBehavior = (quarter: string, value: string) => {
    setData(prev => ({
      ...prev,
      behavior: { ...prev.behavior, [quarter]: value as any }
    }));
  };

  const sections = userRole === "teacher" || userRole === "admin"
    ? [
        { id: "week", label: "Расписание" },
        { id: "title", label: "Титульный лист" },
        { id: "contacts", label: "Контакты" },
        { id: "subjects", label: "Предметы" },
        ...MONTHS.map((m, i) => ({ id: `month-${i}`, label: m })),
        { id: "grades", label: "Аттестация" },
        { id: "holidays", label: "Каникулы" },
        { id: "official", label: "Праздники" },
      ]
    : [
        { id: "week", label: "Расписание" },
        { id: "title", label: "Титульный лист" },
        { id: "contacts", label: "Контакты" },
        { id: "subjects", label: "Предметы" },
        { id: "grades", label: "Аттестация" },
        { id: "holidays", label: "Каникулы" },
        { id: "official", label: "Праздники" },
      ];

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

      <div className="max-w-[210mm] mx-auto bg-white shadow-xl my-0 print:my-0 print:shadow-none rounded-xl overflow-hidden pt-0">
        <div className="bg-white shadow-md border-b-2 border-emerald-300 px-4 py-3 mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-50">
            {sections.map(section => (
              <button key={section.id} onClick={() => setActiveSection(section.id)} className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium text-sm flex-shrink-0 ${activeSection === section.id ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"}`}>{section.label}</button>
            ))}
            <button onClick={() => setGradesPanelOpen(!gradesPanelOpen)} className="px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors text-sm">Оценки</button>
            <button onClick={() => setMessagesPanelOpen(!messagesPanelOpen)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">Сообщения</button>
          </div>
        </div>

        {activeSection === "title" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-amber-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">🎓</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">Дневник учащегося</h2>
              <p className="text-gray-500 text-sm">официальный документ</p>
            </div>
            {selectedGroupId && (
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">📊</span> Пропуски учебных занятий по неделям
                </h3>
                <p className="text-sm text-orange-700 mb-4">Укажите количество пропущенных уроков для каждой недели. Эти данные будут отображаться в дневнике ученика.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {["1","2","3","4"].map(quarter => (
                    <div key={quarter} className="bg-white rounded-lg p-3 border border-orange-200">
                      <h4 className="font-bold text-orange-900 mb-2">Четверть {quarter}</h4>
                      {Array(8).fill(null).map((_, weekNum) => {
                        const weekStart = `Q${quarter}-W${weekNum + 1}`;
                        const weekData = weeklyAbsence[weekStart] || { absent: "", absentUnexcused: "" };
                        return (
                          <div key={weekNum} className="flex items-center gap-2 mb-2 text-xs">
                            <span className="font-medium text-gray-700 w-16">Неделя {weekNum + 1}:</span>
                            <input type="number" placeholder="Всего" min="0" value={weekData.absent} readOnly={!canEditAbsence()} onChange={e => setWeeklyAbsence(prev => ({ ...prev, [weekStart]: { ...weekData, absent: e.target.value } }))} className="w-14 border border-gray-300 rounded px-1 py-0.5 text-center" />
                            <span className="text-gray-400">/</span>
                            <input type="number" placeholder="Неув." min="0" value={weekData.absentUnexcused} readOnly={!canEditAbsence()} onChange={e => setWeeklyAbsence(prev => ({ ...prev, [weekStart]: { ...weekData, absentUnexcused: e.target.value } }))} className="w-14 border border-gray-300 rounded px-1 py-0.5 text-center" />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-emerald-100">
              <h3 className="font-bold text-emerald-800 mb-6 flex items-center gap-2"><span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">📝</span>Основная информация</h3>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-emerald-50"><td className="py-4 font-semibold text-gray-900 w-2/5">Учебный год:</td><td className="py-4"><input type="text" value={sharedData.academicYear || "20__/20__"} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50" /></td></tr>
                  <tr className="border-b border-emerald-50"><td className="py-4 font-semibold text-gray-900 w-2/5">Фамилия:</td><td className="py-4"><input type="text" value={data.surname} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50" /></td></tr>
                  <tr className="border-b border-emerald-50"><td className="py-4 font-semibold text-gray-900 w-2/5">Собственное имя:</td><td className="py-4"><input type="text" value={data.name} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50" /></td></tr>
                  <tr className="border-b border-emerald-50"><td className="py-4 font-semibold text-gray-900 w-2/5">Класс:</td><td className="py-4"><input type="text" value={data.grade} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50" /></td></tr>
                  <tr className="border-b border-emerald-50"><td className="py-4 font-semibold text-gray-900 w-2/5">Наименование учреждения образования:{userRole === "admin" && <span className="block text-xs text-emerald-600 font-normal mt-1">💡 Заполняется один раз, применяется для всех учеников</span>}</td><td className="py-4"><input type="text" value={sharedData.institution || sharedData.schoolName} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50" /></td></tr>
                  <tr className="border-b border-emerald-50 last:border-0"><td className="py-4 font-semibold text-gray-900 w-2/5">Местонахождение учреждения образования:{userRole === "admin" && <span className="block text-xs text-emerald-600 font-normal mt-1">💡 Заполняется один раз, применяется для всех учеников</span>}</td><td className="py-4"><input type="text" value={sharedData.schoolAddress} readOnly className="w-full border-b-2 border-emerald-200 py-2 text-gray-800 bg-gray-50" /></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "contacts" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-violet-50/50 to-white">
            <div className="text-center mb-10"><div className="text-4xl mb-2">📞</div><h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Контактная информация</h2></div>
            <div className="grid md:grid-cols-2 gap-4 mb-10 items-start">
              {[
                {label: "👔 Руководитель учреждения", name: contacts.director || "—", phone: contacts.directorPhone || "—"},
                {label: "🍎 Классный руководитель", name: contacts.homeroomTeacher || "—", phone: contacts.homeroomTeacherPhone || "—"},
                {label: "📚 Заместитель по учебной работе", name: contacts.vicePrincipal || "—", phone: contacts.vicePrincipalPhone || "—"},
                {label: "🌟 Заместитель по воспитательной работе", name: contacts.vicePrincipalEdu || "—", phone: contacts.vicePrincipalEduPhone || "—"},
                {label: "🧠 Педагог-психолог", name: contacts.psychologist || "—", phone: contacts.psychologistPhone || "—"},
                {label: "🤝 Социальный педагог", name: contacts.socialPedagogue || "—", phone: contacts.socialPedagoguePhone || "—"},
              ].map((contact, i) => (
                <div key={i} className="bg-white border border-violet-100 rounded-xl p-4 shadow-md">
                  <label className="block text-sm font-bold text-violet-700 mb-2">{contact.label}{userRole === "admin" && ["📚 Заместитель по учебной работе", "🌟 Заместитель по воспитательной работе", "🧠 Педагог-психолог", "🤝 Социальный педагог"].includes(contact.label) && <span className="block text-xs text-violet-500 font-normal mt-1">💡 Заполняется один раз, применяется для всех учеников</span>}</label>
                  <input type="text" value={contact.name} readOnly className="w-full border-b-2 border-violet-200 py-2 text-gray-800 bg-gray-50 mb-3" />
                  <input type="tel" value={contact.phone} readOnly className="w-full border-b-2 border-violet-200 py-2 text-gray-800 bg-gray-50" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "week" && (
          <div className="p-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg mb-4">
              <div className="flex justify-between items-center">
                <button onClick={() => navigateWeek("prev")} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-bold">‹</button>
                <div className="text-center">
                  <h2 className="text-2xl font-bold capitalize">{selectedWeek.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</h2>
                  <p className="text-sm opacity-90">Неделя {getWeekNumber(selectedWeek)} • {selectedQuarter === "1" ? "I" : selectedQuarter === "2" ? "II" : selectedQuarter === "3" ? "III" : selectedQuarter === "4" ? "IV" : ""} четверть</p>
                  <p className="text-xs opacity-75">{selectedWeek.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })} - {new Date(selectedWeek.getTime() + 5 * 86400000).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}</p>
                </div>
                <button onClick={() => navigateWeek("next")} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-bold">›</button>
              </div>
            </div>

            <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-300">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-emerald-800 font-bold">
                  📚 {selectedQuarter} четверть ({selectedQuarter === "1" ? "сентябрь — ноябрь" : selectedQuarter === "2" ? "ноябрь — январь" : selectedQuarter === "3" ? "январь — апрель" : "апрель — июнь"})
                </p>
                <select value={selectedQuarter} onChange={e => { const q = e.target.value; setSelectedQuarter(q); setSelectedWeek(getApproxStartOfWeekForQuarter(q)); }} className="border-2 border-emerald-400 rounded-lg px-3 py-2 focus:border-emerald-500 focus:outline-none text-sm font-bold text-emerald-700 bg-white">
                  <option value="1">📚 1 четверть</option>
                  <option value="2">❄️ 2 четверть</option>
                  <option value="3">🌸 3 четверть</option>
                  <option value="4">☀️ 4 четверть</option>
                </select>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"].map((day) => {
                  const dayLessons = Object.entries(quarterSchedule).filter(([key]) => key.startsWith(`${day}-`)).map(([key, value]) => ({ lessonNumber: parseInt(key.split('-')[1]) + 1, subject: value as string })).sort((a, b) => a.lessonNumber - b.lessonNumber);
                  return (
                    <div key={day} className="bg-white border-2 border-emerald-200 rounded-lg p-3">
                      <h4 className="font-bold text-sm text-emerald-900 mb-2">{day}</h4>
                      {dayLessons.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-2">
                          <p className="text-sm text-gray-500 italic">Нет уроков</p>
                        </div>
                      ) : (
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

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <label className="text-lg font-bold text-gray-800">Заметки ученика</label>
              </div>
              <textarea value={studentNote} onChange={e => { setStudentNote(e.target.value); handleSaveNote(); }} placeholder="Личные заметки..." className="w-full h-32 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-400 resize-none" />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
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
                        <><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><div><p className="font-medium text-gray-800 text-sm">Классный руководитель просмотрел</p><p className="text-xs text-gray-500">{new Date(teacherVerification.verifiedAt).toLocaleDateString("ru-RU")}</p></div></>
                      ) : (
                        <><div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div><div><p className="font-medium text-gray-700 text-sm">Класс��ый руководитель не просмотрел</p></div></>
                      )}
                    </div>
                    {isHomeroomTeacher && currentUserId && !teacherVerification && <button onClick={handleVerify} disabled={isVerifying} className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition-all flex-shrink-0">{isVerifying ? "..." : "Просмотреть"}</button>}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {parentVerification ? (
                        <><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><div><p className="font-medium text-gray-800 text-sm">Родитель просмотрел</p><p className="text-xs text-gray-500">{new Date(parentVerification.verifiedAt).toLocaleDateString("ru-RU")}</p></div></>
                      ) : (
                        <><div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div><div><p className="font-medium text-gray-700 text-sm">Родитель не просмотрел</p></div></>
                      )}
                    </div>
                    {isParent && currentUserId && !parentVerification && <button onClick={handleParentVerify} disabled={isParentVerifying} className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition-all flex-shrink-0">{isParentVerifying ? "..." : "Просмотреть"}</button>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {activeSection === "grades" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-rose-50/50 to-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <h3 className="text-2xl font-bold">Оценки в дневнике</h3>
              </div>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg" onClick={() => setGradesPanelOpen(v => !v)}>
                {gradesPanelOpen ? 'Свернуть' : 'Показать'}
              </button>
            </div>
            {gradesPanelOpen && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-100 mb-6">
                <div className="grid md:grid-cols-3 gap-4 items-end mb-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Предмет</label>
                    <select value={gradesSubjectFilter} onChange={e => setGradesSubjectFilter(e.target.value)} className="w-full border-2 border-emerald-300 rounded p-2">
                      <option value="ALL">Все предметы</option>
                      {Array.from(new Set(gradesState.map(g => g.subjectName).filter(Boolean))).map((s, i) => (<option key={i} value={s as string}>{s}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Новая оценка</label>
                    <input type="number" placeholder="Оценка" value={newGrade.value} onChange={e => setNewGrade(g => ({ ...g, value: e.target.value }))} className="w-full border-2 border-emerald-300 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Дата</label>
                    <input type="date" value={newGrade.date} onChange={e => setNewGrade(g => ({ ...g, date: e.target.value }))} className="w-full border-2 border-emerald-300 rounded p-2" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <select className="border-2 border-emerald-300 rounded p-2" value={newGrade.subject} onChange={e => setNewGrade(g => ({ ...g, subject: e.target.value }))}>
                    <option value="">Выберите предмет</option>
                    {Array.from(new Set(gradesState.map(g => g.subjectName).filter(Boolean))).map((s,i) => (<option key={i} value={s as string}>{s}</option>))}
                  </select>
                  <button className="px-4 py-2 bg-emerald-500 text-white rounded" onClick={() => {
                    if (!newGrade.subject || !newGrade.value) return;
                    const g = { id: Date.now(), value: newGrade.value, date: newGrade.date || null, subjectName: newGrade.subject, teacherName: '' };
                    setGradesState(prev => [...prev, g]);
                    setNewGrade({ subject: '', value: '', date: '' });
                  }}>Добавить</button>
                </div>
                {/* Средний балл */}
                <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                  {(() => {
                    const filtered = gradesState.filter(g => gradesSubjectFilter === 'ALL' || g.subjectName === gradesSubjectFilter);
                    if (filtered.length === 0) return <p className="text-sm text-gray-500">Нет оценок</p>;
                    const sum = filtered.reduce((a, g) => a + (parseFloat(g.value) || 0), 0);
                    const avg = sum / filtered.length;
                    return <p className="font-bold text-emerald-800">Средний балл: {avg.toFixed(2)} ({filtered.length} оценок)</p>;
                  })()}
                </div>
                <div className="overflow-auto max-h-80">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left border-b"><th className="px-2 py-2">Предмет</th><th className="px-2 py-2">Оценка</th><th className="px-2 py-2">Дата</th></tr></thead>
                    <tbody>
                      {gradesState.filter(g => gradesSubjectFilter === 'ALL' || g.subjectName === gradesSubjectFilter).map((g, idx) => (
                        <tr key={idx} className={idx % 2 ? 'bg-emerald-50' : ''}>
                          <td className="px-2 py-2">{g.subjectName}</td>
                          <td className="px-2 py-2">{g.value}</td>
                          <td className="px-2 py-2">{g.date ?? ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

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

        {activeSection === "official" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-indigo-50/50 to-white">
            <div className="text-center mb-10"><div className="text-4xl mb-2">🇧🇾</div><h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Государственные праздники и памятные даты</h2><p className="text-gray-700 mt-2 font-bold italic">Республики <span className="text-red-600 font-extrabold text-lg">Беларусь</span></p></div>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-lg p-6 border-2 border-red-200"><div className="flex items-center gap-3 mb-4"><span className="text-3xl">🎉</span><h3 className="text-xl font-bold text-red-800">Государственные праздники</h3></div><ul className="space-y-3">{HOLIDAYS_LIST.map((holiday, i) => (<li key={i} className="flex gap-3 items-start bg-white rounded-lg p-3 shadow-sm"><span className="flex-shrink-0 w-24 font-bold text-red-600">{holiday.date}</span><span className="text-gray-700">{holiday.name}</span></li>))}</ul></div>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl shadow-lg p-6 border-2 border-gray-200"><div className="flex items-center gap-3 mb-4"><span className="text-3xl">🕯️</span><h3 className="text-xl font-bold text-gray-800">Памятные даты</h3></div><ul className="space-y-3">{MEMORIAL_DATES.map((date, i) => (<li key={i} className="flex gap-3 items-start bg-white rounded-lg p-3 shadow-sm"><span className="flex-shrink-0 w-24 font-bold text-gray-600">{date.date}</span><span className="text-gray-700">{date.name}</span></li>))}</ul></div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg p-6 border border-emerald-100"><div className="flex items-center gap-3 mb-4"><span className="text-3xl">💼</span><h3 className="text-xl font-bold text-emerald-800">Профессиональные праздники</h3></div><ul className="space-y-3">{PROFESSIONAL_HOLIDAYS.map((holiday, i) => (<li key={i} className="flex gap-3 items-start bg-white rounded-lg p-3 shadow-sm"><span className="flex-shrink-0 w-48 font-bold text-emerald-600">{holiday.date}</span><span className="text-gray-700">{holiday.name}</span></li>))}</ul></div>
          </div>
        )}

        {messagesPanelOpen && (
          <div className="p-12 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <h3 className="text-2xl font-bold">Сообщения</h3>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={() => setMessagesPanelOpen(false)}>Закрыть</button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Получатель</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="msgTo" value="student" checked={messageTo === "student"} onChange={() => setMessageTo("student")} className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Ученику</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="msgTo" value="class" checked={messageTo === "class"} onChange={() => setMessageTo("class")} className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Классу</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="msgTo" value="leader" checked={messageTo === "leader"} onChange={() => setMessageTo("leader")} className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Классному руководителю</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Текст</label>
                  <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Введите сообщение..." className="w-full h-24 border-2 border-blue-300 rounded p-2" />
                </div>
                <button onClick={() => {
                  if (!newMessage.trim()) return;
                  const msg = {
                    to: messageTo === "student" ? "Ученику" : messageTo === "class" ? "Классу" : "Классному руководителю",
                    text: newMessage,
                    date: new Date().toLocaleDateString("ru-RU")
                  };
                  setMessages(prev => [msg, ...prev]);
                  setNewMessage("");
                }} className="px-4 py-2 bg-blue-600 text-white rounded w-full">Отправить</button>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-blue-800">Последние сообщения</h4>
                {messages.map((msg, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="flex justify-between">
                      <span className="font-medium">{msg.to}</span>
                      <span className="text-xs text-gray-500">{msg.date}</span>
                    </div>
                    <p className="text-gray-700">{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}