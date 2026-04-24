"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HolidayPeriod {
  start: string;
  end: string;
}

interface HolidaysData {
  academicYear: string;
  autumn: HolidayPeriod;
  winter: HolidayPeriod;
  spring: HolidayPeriod;
  summer: HolidayPeriod;
}

const ACADEMIC_YEARS = [
  "2024/2025",
  "2025/2026",
  "2026/2027",
  "2027/2028",
];

export default function HolidaysAdminPage() {
  const [selectedYear, setSelectedYear] = useState("2025/2026");
  const [holidays, setHolidays] = useState<HolidaysData>({
    academicYear: "2025/2026",
    autumn: { start: "", end: "" },
    winter: { start: "", end: "" },
    spring: { start: "", end: "" },
    summer: { start: "", end: "" },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Загрузка данных при изменении учебного года
  useEffect(() => {
    loadHolidays();
  }, [selectedYear]);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/holidays?academicYear=${selectedYear}`);
      const data = await response.json();
      
      if (data) {
        setHolidays({
          academicYear: selectedYear,
          autumn: parseHolidayString(data.autumn),
          winter: parseHolidayString(data.winter),
          spring: parseHolidayString(data.spring),
          summer: parseHolidayString(data.summer),
        });
      }
    } catch (error) {
      console.error("Ошибка загрузки каникул:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseHolidayString = (str: string): HolidayPeriod => {
    if (!str) return { start: "", end: "" };
    const match = str.match(/(.+?)\s+-\s+(.+)/);
    if (match) {
      return { start: formatDateForInput(match[1]), end: formatDateForInput(match[2]) };
    }
    return { start: "", end: "" };
  };

  const formatDateForInput = (dateStr: string): string => {
    // Преобразуем формат "28.10.2025" в "2025-10-28"
    const match = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return dateStr;
  };

  const formatDateForDisplay = (dateStr: string): string => {
    // Преобразуем формат "2025-10-28" в "28.10.2025"
    if (!dateStr) return "";
    const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return `${match[3]}.${match[2]}.${match[1]}`;
    }
    return dateStr;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        academicYear: selectedYear,
        autumn: holidays.autumn.start && holidays.autumn.end 
          ? `с ${formatDateForDisplay(holidays.autumn.start)} по ${formatDateForDisplay(holidays.autumn.end)}`
          : "",
        winter: holidays.winter.start && holidays.winter.end
          ? `с ${formatDateForDisplay(holidays.winter.start)} по ${formatDateForDisplay(holidays.winter.end)}`
          : "",
        spring: holidays.spring.start && holidays.spring.end
          ? `с ${formatDateForDisplay(holidays.spring.start)} по ${formatDateForDisplay(holidays.spring.end)}`
          : "",
        summer: holidays.summer.start && holidays.summer.end
          ? `с ${formatDateForDisplay(holidays.summer.start)} по ${formatDateForDisplay(holidays.summer.end)}`
          : "",
      };

      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Каникулы успешно сохранены!" });
      } else {
        setMessage({ type: "error", text: "Ошибка при сохранении" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка сети" });
    } finally {
      setSaving(false);
    }
  };

  const updateHoliday = (period: keyof Omit<HolidaysData, "academicYear">, field: "start" | "end", value: string) => {
    setHolidays((prev) => ({
      ...prev,
      [period]: {
        ...prev[period],
        [field]: value,
      },
    }));
  };

  const HolidayPeriodCard = ({
    title,
    icon,
    color,
    period,
  }: {
    title: string;
    icon: string;
    color: string;
    period: keyof Omit<HolidaysData, "academicYear">;
  }) => (
    <div className={`bg-gradient-to-br ${color} rounded-xl shadow-lg p-6 border-2`}>
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        {title}
      </h3>
      
      <div className="space-y-4">
        {/* Начало периода */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Начало периода:
          </label>
          <input
            type="date"
            value={holidays[period].start}
            onChange={(e) => updateHoliday(period, "start", e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white text-gray-900 font-bold"
          />
        </div>

        {/* Конец периода */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Конец периода (включительно):
          </label>
          <input
            type="date"
            value={holidays[period].end}
            onChange={(e) => updateHoliday(period, "end", e.target.value)}
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white text-gray-900 font-bold"
          />
        </div>

        {/* Предпросмотр */}
        {holidays[period].start && holidays[period].end && (
          <div className="mt-4 p-3 bg-white/70 rounded-lg">
            <p className="text-sm font-bold text-gray-800">
              {formatDateForDisplay(holidays[period].start)} — {formatDateForDisplay(holidays[period].end)}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Навигация */}
        <div className="flex items-center justify-between flex-wrap gap-4">
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
            <h1 className="text-3xl font-bold text-gray-800">🏖️ Управление каникулами</h1>
          </div>
        </div>

        {/* Выбор учебного года */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <label className="block text-sm font-bold text-gray-800 mb-2">
            Учебный год:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white text-gray-900 font-bold"
          >
            {ACADEMIC_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Сообщение */}
        {message && (
          <div
            className={`p-4 rounded-xl shadow-lg ${
              message.type === "success" ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-300" : "bg-red-100 text-red-800 border-2 border-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{message.type === "success" ? "✅" : "❌"}</span>
              <span className="font-bold">{message.text}</span>
            </div>
          </div>
        )}

        {/* Загрузка */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Загрузка...</p>
          </div>
        )}

        {/* Формы каникул */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HolidayPeriodCard
                title="Осенние каникулы"
                icon="🍂"
                color="from-amber-50 to-orange-50 border-amber-200"
                period="autumn"
              />
              <HolidayPeriodCard
                title="Зимние каникулы"
                icon="❄️"
                color="from-sky-50 to-blue-50 border-sky-200"
                period="winter"
              />
              <HolidayPeriodCard
                title="Весенние каникулы"
                icon="🌸"
                color="from-pink-50 to-rose-50 border-pink-200"
                period="spring"
              />
              <HolidayPeriodCard
                title="Летние каникулы"
                icon="☀️"
                color="from-yellow-50 to-amber-50 border-yellow-200"
                period="summer"
              />
            </div>

            {/* Кнопка сохранения */}
            <div className="flex justify-center pt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Сохранение...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Сохранить каникулы
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
