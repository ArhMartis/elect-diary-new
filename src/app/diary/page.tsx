"use client";

import { useState, useEffect, use } from "react";

// Типы данных
interface DiaryData {
  // Титульный лист
  academicYear: string;
  surname: string;
  name: string;
  grade: string;
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  
  // Контакты
  director: string;
  vicePrincipal: string;
  vicePrincipalEdu: string;
  homeroomTeacher: string;
  psychologist: string;
  socialPedagogue: string;
  
  // Предметы и учителя
  subjects: { name: string; teacher: string }[];
  electives: { name: string; teacher: string; schedule: string }[];
  
  // Расписание звонков
  bellSchedule: { number: string; start: string; end: string; break: string }[];
  
  // Месячные данные
  months: MonthData[];
  
  // Аттестация
  grades: { subject: string; q1: string; q2: string; q3: string; q4: string; year: string; exam: string; final: string }[];
  
  // Каникулы
  holidays: { autumn: string; winter: string; spring: string; summer: string };

  // Решение о переводе
  decisionText: string;
}

interface MonthData {
  name: string;
  days: DayData[];
  absent: string;
  absentUnexcused: string;
  teacherSigned: boolean;
  parentSigned: boolean;
}

interface DayData {
  date: string;
  lessons: LessonData[];
}

interface LessonData {
  subject: string;
  homework: string;
  grade: string;
  teacherSign: string;
}

const MONTHS = ["Сентябрь", "Октябрь", "Ноябрь", "Декабрь", "Январь", "Февраль", "Март", "Апрель", "Май"];

const DEFAULT_SUBJECTS = [
  "Белорусский язык", "Русский язык", "Белорусская литература", "Русская литература",
  "Иностранный язык", "Математика", "Алгебра", "Геометрия", "Информатика",
  "Физика", "Химия", "Биология", "География", "История Беларуси",
  "Всемирная история", "Обществоведение", "Физическая культура", "Трудовое обучение", "Искусство"
];

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

const DEFAULT_DATA: DiaryData = {
  academicYear: "", surname: "", name: "", grade: "", schoolName: "", schoolAddress: "", schoolPhone: "",
  director: "", vicePrincipal: "", vicePrincipalEdu: "", homeroomTeacher: "", psychologist: "", socialPedagogue: "",
  subjects: DEFAULT_SUBJECTS.map(s => ({ name: s, teacher: "" })),
  electives: Array(4).fill({ name: "", teacher: "", schedule: "" }),
  bellSchedule: [
    { number: "1", start: "8:00", end: "8:45", break: "15 мин" },
    { number: "2", start: "9:00", end: "9:45", break: "10 мин" },
    { number: "3", start: "10:00", end: "10:45", break: "20 мин" },
    { number: "4", start: "11:05", end: "11:50", break: "10 мин" },
    { number: "5", start: "12:00", end: "12:45", break: "10 мин" },
    { number: "6", start: "12:55", end: "13:40", break: "10 мин" },
    { number: "7", start: "13:50", end: "14:35", break: "10 мин" },
    { number: "8", start: "14:45", end: "15:30", break: "—" },
  ],
  months: MONTHS.map(name => ({
    name,
    days: Array(25).fill(null).map((_, i) => ({
      date: "",
      lessons: Array(8).fill({ subject: "", homework: "", grade: "", teacherSign: "" }),
    })),
    absent: "",
    absentUnexcused: "",
    teacherSigned: false,
    parentSigned: false,
  })),
  grades: DEFAULT_SUBJECTS.map(s => ({ subject: s, q1: "", q2: "", q3: "", q4: "", year: "", exam: "", final: "" })),
  holidays: { autumn: "", winter: "", spring: "", summer: "" },
  decisionText: "",
};

export default function DiaryPage() {
  const [data, setData] = useState<DiaryData>(DEFAULT_DATA);
  const [activeSection, setActiveSection] = useState<string>("title");
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузка из localStorage при монтировании
  useEffect(() => {
    const saved = localStorage.getItem("diaryData");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Ошибка загрузки данных:", e);
      }
    }
    setIsLoaded(true);
  }, []);

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

  // Сохранение в localStorage
  const saveData = () => {
    localStorage.setItem("diaryData", JSON.stringify(data));
    setShowSaveNotification(true);
    setTimeout(() => setShowSaveNotification(false), 3000);
  };

  // Загрузка из localStorage
  const loadData = () => {
    const saved = localStorage.getItem("diaryData");
    if (saved) {
      try {
        setData(JSON.parse(saved));
        alert("Данные успешно загружены!");
      } catch (e) {
        alert("Ошибка загрузки данных");
      }
    } else {
      alert("Нет сохранённых данных");
    }
  };

  // Очистка данных
  const clearData = () => {
    if (confirm("Вы уверены, что хотите очистить все данные?")) {
      setData(DEFAULT_DATA);
      localStorage.removeItem("diaryData");
    }
  };

  // Печать
  const handlePrint = () => {
    window.print();
  };

  // Обновление поля
  const updateField = (section: string, field: string, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Обновление предмета
  const updateSubject = (index: number, field: "name" | "teacher", value: string) => {
    setData(prev => {
      const subjects = [...prev.subjects];
      subjects[index] = { ...subjects[index], [field]: value };
      return { ...prev, subjects };
    });
  };

  // Обновление месяца
  const updateMonth = (monthIndex: number, field: string, value: string | boolean) => {
    setData(prev => {
      const months = [...prev.months];
      months[monthIndex] = { ...months[monthIndex], [field]: value };
      return { ...prev, months };
    });
  };

  // Обновление дня в месяце
  const updateDay = (monthIndex: number, dayIndex: number, field: string, value: string) => {
    setData(prev => {
      const months = [...prev.months];
      const days = [...months[monthIndex].days];
      days[dayIndex] = { ...days[dayIndex], [field]: value };
      months[monthIndex] = { ...months[monthIndex], days };
      return { ...prev, months };
    });
  };

  // Обновление урока в дне
  const updateLesson = (monthIndex: number, dayIndex: number, lessonIndex: number, field: string, value: string) => {
    setData(prev => {
      const months = [...prev.months];
      const days = [...months[monthIndex].days];
      const lessons = [...days[dayIndex].lessons];
      lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value };
      days[dayIndex] = { ...days[dayIndex], lessons };
      months[monthIndex] = { ...months[monthIndex], days };
      return { ...prev, months };
    });
  };

  // Обновление оценок
  const updateGrade = (index: number, field: string, value: string) => {
    setData(prev => {
      const grades = [...prev.grades];
      grades[index] = { ...grades[index], [field]: value };
      return { ...prev, grades };
    });
  };

  const sections = [
    { id: "title", label: "Титульный лист" },
    { id: "contacts", label: "Контакты" },
    { id: "subjects", label: "Предметы" },
    { id: "schedule", label: "Расписание" },
    ...MONTHS.map((m, i) => ({ id: `month-${i}`, label: m })),
    { id: "grades", label: "Аттестация" },
    { id: "holidays", label: "Каникулы" },
    { id: "official", label: "Праздники" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 font-sans">
      {/* Панель управления */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-xl border-b-2 border-emerald-300 no-print">
        <div className="max-w-[210mm] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <span className="font-bold text-emerald-800 text-lg hidden sm:inline">Электронный дневник</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={saveData} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 shadow-md transition-all font-medium text-sm">
                💾 Сохранить
              </button>
              <button onClick={loadData} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 shadow-md transition-all font-medium text-sm">
                📂 Загрузить
              </button>
              <button onClick={handlePrint} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 shadow-md transition-all font-medium text-sm">
                🖨️ Печать
              </button>
              <button onClick={clearData} className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 shadow-md transition-all font-medium text-sm">
                🗑️ Очистить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Уведомление о сохранении */}
      {showSaveNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg shadow-xl animate-pulse font-medium">
          ✓ Данные успешно сохранены!
        </div>
      )}

      {/* Навигация по секциям */}
      <div className="bg-white shadow-md border-b border-emerald-100 no-print">
        <div className="max-w-[210mm] mx-auto">
          <div className="flex gap-1 overflow-x-auto py-2 px-4 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-50">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all font-medium text-sm ${
                  activeSection === section.id
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-xl my-4 print:my-0 print:shadow-none rounded-xl overflow-hidden pt-4">
        {/* Титульный лист */}
        {activeSection === "title" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-amber-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">🎓</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">
                Дневник учащегося
              </h2>
              <p className="text-gray-500 text-sm">официальный документ</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-emerald-100">
              <h3 className="font-bold text-emerald-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">📝</span>
                Основная информация
              </h3>
              <table className="w-full">
                <tbody>
                  {[
                    ["Учебный год:", "academicYear", "20__/20__"],
                    ["Фамилия:", "surname", ""],
                    ["Собственное имя:", "name", ""],
                    ["Класс:", "grade", "V–XI"],
                    ["Наименование учреждения образования:", "schoolName", ""],
                    ["Местонахождение:", "schoolAddress", ""],
                    ["Телефон:", "schoolPhone", ""],
                  ].map(([label, field, placeholder]) => (
                    <tr key={field} className="border-b border-emerald-50 last:border-0">
                      <td className="py-4 font-semibold text-gray-700 w-2/5">{label}</td>
                      <td className="py-4">
                        <input
                          type="text"
                          value={data[field as keyof DiaryData] as string}
                          onChange={e => updateField("title", field, e.target.value)}
                          placeholder={placeholder}
                          className="w-full border-b-2 border-emerald-200 focus:border-emerald-500 focus:outline-none py-2 text-gray-800 placeholder-gray-300 transition-colors"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                  <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">⭐</span>
                  Права учащегося
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    "получение качественного общего среднего образования;",
                    "уважение человеческого достоинства;",
                    "защиту от всех форм насилия;",
                    "свободу совести и информации;",
                    "участие в управлении учреждением;",
                    "бесплатное пользование учебниками;",
                    "каникулы в течение учебного года;",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl shadow-lg p-6 border border-rose-100">
                <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2 text-lg">
                  <span className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">📋</span>
                  Обязанности учащегося
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  {[
                    "добросовестно учиться;",
                    "выполнять требования Устава;",
                    "уважать честь и достоинство других;",
                    "бережно относиться к имуществу;",
                    "соблюдать правила охраны труда;",
                    "приходить на занятия за 5 минут до начала;",
                    "вести дневник и показывать родителям.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-amber-100">
              <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2 text-lg">
                <span className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">📖</span>
                Порядок ведения дневника
              </h3>
              <ol className="space-y-2 text-sm text-gray-700">
                {[
                  "Дневник является официальным документом.",
                  "Учащийся обязан ежедневно записывать домашние задания.",
                  "Оценки выставляются учителем в день проведения урока.",
                  "Родители ежедневно проверяют дневник и ставят подпись.",
                  "Классный руководитель еженедельно просматривает дневник.",
                  "Записи должны быть аккуратными и разборчивыми.",
                  "Запрещается делать посторонние записи и рисунки.",
                  "При потере дневника учащийся обязан сообщить классному руководителю.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Контакты */}
        {activeSection === "contacts" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-violet-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">📞</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                Контактная информация
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {[
                ["👔 Руководитель учреждения", "director"],
                ["📚 Заместитель по учебной работе", "vicePrincipal"],
                ["🌟 Заместитель по воспитательной работе", "vicePrincipalEdu"],
                ["🍎 Классный руководитель", "homeroomTeacher"],
                ["🧠 Педагог-психолог", "psychologist"],
                ["🤝 Социальный педагог", "socialPedagogue"],
              ].map(([label, field]) => (
                <div key={field} className="bg-white border border-violet-100 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                  <label className="block text-sm font-bold text-violet-700 mb-2">{label}</label>
                  <input
                    type="text"
                    value={data[field as keyof DiaryData] as string}
                    onChange={e => updateField("contacts", field, e.target.value)}
                    placeholder="ФИО, телефон"
                    className="w-full border-b-2 border-violet-200 focus:border-violet-500 focus:outline-none py-2 text-gray-800 placeholder-gray-300 transition-colors"
                  />
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-cyan-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🔔</span>
                <h2 className="text-2xl font-bold text-cyan-800">Расписание звонков</h2>
              </div>
              <table className="w-full border-collapse rounded-xl overflow-hidden shadow-md">
                <thead>
                  <tr className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                    <th className="border border-cyan-400 p-3 font-semibold">№</th>
                    <th className="border border-cyan-400 p-3 font-semibold">Начало</th>
                    <th className="border border-cyan-400 p-3 font-semibold">Конец</th>
                    <th className="border border-cyan-400 p-3 font-semibold">Перемена</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bellSchedule.map((bell, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-cyan-50"}>
                      <td className="border border-cyan-200 p-3">
                        <input
                          type="text"
                          value={bell.number}
                          onChange={e => {
                            const schedule = [...data.bellSchedule];
                            schedule[i].number = e.target.value;
                            setData({ ...data, bellSchedule: schedule });
                          }}
                          className="w-full text-center font-bold text-black"
                        />
                      </td>
                      <td className="border border-cyan-200 p-3">
                        <input
                          type="text"
                          value={bell.start}
                          onChange={e => {
                            const schedule = [...data.bellSchedule];
                            schedule[i].start = e.target.value;
                            setData({ ...data, bellSchedule: schedule });
                          }}
                          className="w-full text-center font-bold text-black"
                        />
                      </td>
                      <td className="border border-cyan-200 p-3">
                        <input
                          type="text"
                          value={bell.end}
                          onChange={e => {
                            const schedule = [...data.bellSchedule];
                            schedule[i].end = e.target.value;
                            setData({ ...data, bellSchedule: schedule });
                          }}
                          className="w-full text-center font-bold text-black"
                        />
                      </td>
                      <td className="border border-cyan-200 p-3">
                        <input
                          type="text"
                          value={bell.break}
                          onChange={e => {
                            const schedule = [...data.bellSchedule];
                            schedule[i].break = e.target.value;
                            setData({ ...data, bellSchedule: schedule });
                          }}
                          className="w-full text-center font-bold text-black"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Предметы */}
        {activeSection === "subjects" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-emerald-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">📐</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                Учебные предметы и учителя
              </h2>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-10 border border-emerald-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    <th className="border border-emerald-400 p-4 font-semibold w-2/3">📖 Учебный предмет</th>
                    <th className="border border-emerald-400 p-4 font-semibold">👨‍🏫 Учитель (ФИО)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjects.map((subject, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-emerald-50"}>
                      <td className="border border-emerald-200 p-3">
                        <input
                          type="text"
                          value={subject.name}
                          onChange={e => updateSubject(i, "name", e.target.value)}
                          className="w-full text-gray-700"
                        />
                      </td>
                      <td className="border border-emerald-200 p-3">
                        <input
                          type="text"
                          value={subject.teacher}
                          onChange={e => updateSubject(i, "teacher", e.target.value)}
                          className="w-full text-gray-700"
                          placeholder="Введите ФИО учителя"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-amber-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🌟</span>
                <h2 className="text-2xl font-bold text-amber-800">Факультативные занятия</h2>
              </div>
              <table className="w-full bg-white rounded-xl overflow-hidden shadow-md">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <th className="border border-amber-400 p-3 font-semibold">Название факультатива</th>
                    <th className="border border-amber-400 p-3 font-semibold">Учитель</th>
                    <th className="border border-amber-400 p-3 font-semibold">День и время</th>
                  </tr>
                </thead>
                <tbody>
                  {data.electives.map((elective, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                      <td className="border border-amber-200 p-3">
                        <input
                          type="text"
                          value={elective.name}
                          onChange={e => {
                            const electives = [...data.electives];
                            electives[i].name = e.target.value;
                            setData({ ...data, electives });
                          }}
                          className="w-full text-gray-700"
                          placeholder="Название факультатива"
                        />
                      </td>
                      <td className="border border-amber-200 p-3">
                        <input
                          type="text"
                          value={elective.teacher}
                          onChange={e => {
                            const electives = [...data.electives];
                            electives[i].teacher = e.target.value;
                            setData({ ...data, electives });
                          }}
                          className="w-full text-gray-700"
                          placeholder="ФИО учителя"
                        />
                      </td>
                      <td className="border border-amber-200 p-3">
                        <input
                          type="text"
                          value={elective.schedule}
                          onChange={e => {
                            const electives = [...data.electives];
                            electives[i].schedule = e.target.value;
                            setData({ ...data, electives });
                          }}
                          className="w-full text-gray-700"
                          placeholder="Например: Пн 15:00"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Расписание */}
        {activeSection === "schedule" && (
          <div className="min-h-[297mm] p-8">
            <h2 className="text-2xl font-bold text-green-800 mb-6">Расписание уроков</h2>
            <p className="text-sm text-gray-600 mb-4">
              Заполните расписание для каждого дня недели. Используйте поля для указания предметов по дням.
            </p>
            
            <div className="space-y-4">
              {["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"].map((day, dayIndex) => (
                <div key={day} className="border border-gray-400 rounded-lg p-4">
                  <h3 className="font-bold text-green-800 mb-2">{day}</h3>
                  <div className="space-y-2">
                    {Array(8).fill(null).map((_, lessonIndex) => (
                      <div key={lessonIndex} className="flex gap-2 items-center">
                        <span className="w-6 text-center font-semibold">{lessonIndex + 1}</span>
                        <input
                          type="text"
                          placeholder="Предмет"
                          className="flex-1 border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Месячные страницы */}
        {activeSection.startsWith("month-") && (
          <MonthPage
            monthIndex={parseInt(activeSection.split("-")[1])}
            data={data}
            updateMonth={updateMonth}
            updateDay={updateDay}
            updateLesson={updateLesson}
          />
        )}

        {/* Аттестация */}
        {activeSection === "grades" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-rose-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">📊</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">
                Сведения о результатах аттестации
              </h2>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-rose-100">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                      <th className="border border-rose-400 p-3 text-left font-semibold min-w-[180px]">📖 Учебный предмет</th>
                      <th className="border border-rose-400 p-3 font-semibold">I четв.</th>
                      <th className="border border-rose-400 p-3 font-semibold">II четв.</th>
                      <th className="border border-rose-400 p-3 font-semibold">III четв.</th>
                      <th className="border border-rose-400 p-3 font-semibold">IV четв.</th>
                      <th className="border border-rose-400 p-3 font-semibold bg-rose-600/50">Годовая</th>
                      <th className="border border-rose-400 p-3 font-semibold bg-rose-600/50">Экзамен.</th>
                      <th className="border border-rose-400 p-3 font-semibold bg-rose-600/30">Итоговая</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.grades.map((grade, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-rose-50"}>
                        <td className="border border-rose-200 p-2">
                          <input
                            type="text"
                            value={grade.subject}
                            onChange={e => updateGrade(i, "subject", e.target.value)}
                            className="w-full text-gray-700 font-medium"
                          />
                        </td>
                        {["q1", "q2", "q3", "q4", "year", "exam", "final"].map((field, fi) => (
                          <td key={field} className="border border-rose-200 p-2">
                            <input
                              type="text"
                              value={grade[field as keyof typeof grade]}
                              onChange={e => updateGrade(i, field, e.target.value)}
                              className="w-full text-center font-bold text-black"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border-2 border-amber-300">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📜</span>
                <label className="text-xl font-bold text-amber-800">Принято решение</label>
              </div>
              <input
                type="text"
                value={data.decisionText}
                onChange={e => setData({ ...data, decisionText: e.target.value })}
                placeholder="Дата и номер приказа о переводе в следующий класс / об окончании учреждения образования"
                className="w-full border-2 border-amber-300 rounded-xl px-4 py-3 focus:border-amber-500 focus:outline-none bg-white text-gray-700"
              />
            </div>
          </div>
        )}

        {/* Каникулы */}
        {activeSection === "holidays" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-sky-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">🏖️</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600">
                Каникулы
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                ["🍂 Осенние каникулы", "autumn"],
                ["❄️ Зимние каникулы", "winter"],
                ["🌸 Весенние каникулы", "spring"],
                ["☀️ Летние каникулы", "summer"],
              ].map(([label, field]) => (
                <div key={field} className="bg-gradient-to-br from-white to-sky-50 rounded-2xl shadow-lg p-6 border-2 border-sky-200">
                  <label className="block text-lg font-bold text-sky-800 mb-3">{label}</label>
                  <input
                    type="text"
                    value={data.holidays[field as keyof typeof data.holidays]}
                    onChange={e => {
                      const holidays = { ...data.holidays, [field]: e.target.value };
                      setData({ ...data, holidays });
                    }}
                    placeholder="с __ по __"
                    className="w-full border-2 border-sky-300 rounded-xl px-4 py-3 focus:border-sky-500 focus:outline-none text-gray-700 text-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Официальная информация */}
        {activeSection === "official" && (
          <div className="min-h-[297mm] p-12 bg-gradient-to-b from-indigo-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">🇧🇾</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                Государственные праздники и памятные даты
              </h2>
              <p className="text-gray-500 mt-2">Республики Беларусь</p>
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
              <ul className="grid md:grid-cols-2 gap-3">
                {[
                  { date: "Последнее воскресенье января", name: "День белорусской науки" },
                  { date: "15 мая", name: "День семьи" },
                  { date: "1 июня", name: "День защиты детей" },
                  { date: "28 июня", name: "День молодежи" },
                  { date: "1 сентября", name: "День знаний" },
                  { date: "5 октября", name: "День учителя" },
                  { date: "14 ноября", name: "День социального работника" },
                ].map((holiday, i) => (
                  <li key={i} className="flex gap-3 items-start bg-white rounded-lg p-3 shadow-sm">
                    <span className="flex-shrink-0 font-bold text-emerald-600">{holiday.date}</span>
                    <span className="text-gray-700">{holiday.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Подвал */}
        <div className="text-center py-8 text-gray-500 text-sm no-print border-t border-gray-200 mt-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">📚</span>
            <span>Электронный дневник учащегося</span>
          </div>
          <p>Республика Беларусь • 2026</p>
        </div>
      </div>

      {/* Стили для печати */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
          }
          .shadow-xl {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Компонент страницы месяца
function MonthPage({
  monthIndex,
  data,
  updateMonth,
  updateDay,
  updateLesson,
}: {
  monthIndex: number;
  data: DiaryData;
  updateMonth: (index: number, field: string, value: any) => void;
  updateDay: (monthIndex: number, dayIndex: number, field: string, value: string) => void;
  updateLesson: (monthIndex: number, dayIndex: number, lessonIndex: number, field: string, value: string) => void;
}) {
  const month = data.months[monthIndex];
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  return (
    <div className="min-h-[297mm] p-8">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-green-800">Месяц:</h2>
        <input
          type="text"
          value={month.name}
          onChange={e => updateMonth(monthIndex, "name", e.target.value)}
          className="text-2xl font-bold border-b-2 border-green-800 focus:outline-none w-48"
        />
      </div>

      {/* Таблица дней */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-400 text-xs">
          <thead>
            <tr className="bg-green-50">
              <th className="border border-gray-400 p-1 w-16">Дата</th>
              {days.map(day => (
                <th key={day} className="border border-gray-400 p-1 min-w-[120px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array(5).fill(null).map((_, weekIndex) => (
              <tr key={weekIndex}>
                <td className="border border-gray-400 p-1">
                  <input
                    type="text"
                    value={month.days[weekIndex * 6]?.date || ""}
                    onChange={e => updateDay(monthIndex, weekIndex * 6, "date", e.target.value)}
                    placeholder="__.__"
                    className="w-full text-center font-semibold"
                  />
                </td>
                {days.map((_, dayIndex) => {
                  const globalDayIndex = weekIndex * 6 + dayIndex;
                  if (globalDayIndex >= month.days.length) return null;
                  return (
                    <td key={dayIndex} className="border border-gray-400 p-1 align-top">
                      <div className="space-y-1">
                        {month.days[globalDayIndex].lessons.slice(0, 3).map((lesson, lessonIndex) => (
                          <div key={lessonIndex} className="border border-gray-300 rounded p-1">
                            <input
                              type="text"
                              value={lesson.subject}
                              onChange={e => updateLesson(monthIndex, globalDayIndex, lessonIndex, "subject", e.target.value)}
                              placeholder="Предмет"
                              className="w-full text-xs mb-1"
                            />
                            <textarea
                              value={lesson.homework}
                              onChange={e => updateLesson(monthIndex, globalDayIndex, lessonIndex, "homework", e.target.value)}
                              placeholder="Д/З"
                              className="w-full text-xs mb-1 resize-none h-6"
                            />
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={lesson.grade}
                                onChange={e => updateLesson(monthIndex, globalDayIndex, lessonIndex, "grade", e.target.value)}
                                placeholder="Оц"
                                className="w-6 text-center text-xs font-bold text-red-600"
                              />
                              <input
                                type="text"
                                value={lesson.teacherSign}
                                onChange={e => updateLesson(monthIndex, globalDayIndex, lessonIndex, "teacherSign", e.target.value)}
                                placeholder="Подпись"
                                className="flex-1 text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Итоги месяца */}
      <div className="border-2 border-green-800 rounded-lg p-4 bg-green-50">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-semibold">Количество пропущенных учебных занятий:</label>
            <input
              type="number"
              value={month.absent}
              onChange={e => updateMonth(monthIndex, "absent", e.target.value)}
              className="w-16 border-b border-dotted border-gray-400 text-center"
              min="0"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-semibold">в том числе по неуважительным причинам:</label>
            <input
              type="number"
              value={month.absentUnexcused}
              onChange={e => updateMonth(monthIndex, "absentUnexcused", e.target.value)}
              className="w-16 border-b border-dotted border-gray-400 text-center"
              min="0"
            />
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={month.teacherSigned}
              onChange={e => updateMonth(monthIndex, "teacherSigned", e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm">Подпись классного руководителя</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={month.parentSigned}
              onChange={e => updateMonth(monthIndex, "parentSigned", e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm">Подпись родителя</label>
          </div>
        </div>
      </div>
    </div>
  );
}
