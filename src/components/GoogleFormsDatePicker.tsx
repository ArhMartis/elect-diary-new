"use client";

import { useState, useMemo } from "react";

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

const WEEKS = ["1", "2", "3", "4", "5"];

export default function GoogleFormsDatePicker({ value, onChange, label = "Дата" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Текущая дата
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Генерируем годы (текущий ± 2 года)
  const years = useMemo(() => {
    const result: number[] = [];
    for (let i = currentYear - 1; i <= currentYear + 2; i++) {
      result.push(i);
    }
    return result;
  }, [currentYear]);

  // Получаем выбранные значения
  const selectedDate = value ? new Date(value + "T12:00:00") : null;
  const selectedYear = selectedDate?.getFullYear();
  const selectedMonth = selectedDate?.getMonth();
  const selectedDay = selectedDate?.getDate();

  // Вычисляем неделю месяца
  const getWeekOfMonth = (date: Date | null) => {
    if (!date) return null;
    const day = date.getDate();
    return Math.ceil(day / 7);
  };
  const selectedWeek = getWeekOfMonth(selectedDate);

  // Получаем дни для выбранного месяца и года
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleSelect = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, "0");
    const dayStr = String(date.getDate()).padStart(2, "0");
    onChange(`${yearStr}-${monthStr}-${dayStr}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      {/* Кнопка открытия */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border-2 rounded-lg px-4 py-2.5 text-left flex items-center justify-between gap-3 transition-all ${
          value 
            ? "border-gray-300 bg-white text-gray-800" 
            : "border-gray-200 bg-gray-50 text-gray-500"
        } focus:outline-none focus:border-blue-500`}
      >
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{value ? new Date(value + "T12:00:00").toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Выберите дату"}</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Выпадающий календарь */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Заголовок с кнопками навигации */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const newDate = selectedDate ? new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)) : new Date();
                    handleSelect(newDate.getFullYear(), newDate.getMonth(), 1);
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-center">
                  <div className="font-semibold text-lg">
                    {selectedMonth !== undefined ? MONTHS[selectedMonth] : MONTHS[now.getMonth()]} {selectedYear || currentYear}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newDate = selectedDate ? new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)) : new Date();
                    handleSelect(newDate.getFullYear(), newDate.getMonth(), 1);
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Сетка календаря */}
            <div className="p-4">
              {/* Дни недели */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Дни месяца */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const year = selectedYear || currentYear;
                  const month = selectedMonth ?? now.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const daysInMonth = getDaysInMonth(year, month);
                  const startDay = firstDay.getDay() || 7; // Пн=1, Вс=7
                  const days: (number | null)[] = [];
                  
                  // Пустые ячейки до первого дня
                  for (let i = 1; i < startDay; i++) {
                    days.push(null);
                  }
                  // Дни месяца
                  for (let i = 1; i <= daysInMonth; i++) {
                    days.push(i);
                  }
                  
                  return days.map((day, idx) => {
                    const isSelected = day === selectedDay && month === selectedMonth && year === selectedYear;
                    const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={day === null}
                        onClick={() => day && handleSelect(year, month, day)}
                        className={`
                          aspect-square text-sm rounded-lg transition-all
                          ${day === null ? "invisible" : ""}
                          ${isSelected 
                            ? "bg-blue-600 text-white font-bold shadow-md" 
                            : isToday
                              ? "bg-blue-100 text-blue-700 font-semibold border-2 border-blue-500"
                              : "hover:bg-gray-100 text-gray-700"
                          }
                        `}
                      >
                        {day}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => handleSelect(now.getFullYear(), now.getMonth(), now.getDate())}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                >
                  Сегодня
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
                  >
                    Очистить
                  </button>
                )}
              </div>

              {/* Информация о выбранной дате */}
              {value && (
                <div className="mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      Выбрано: {new Date(value + "T12:00:00").toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
