"use client";

import { useState, useEffect, useMemo } from "react";

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
  teacherId: string;
  teacherName: string | null;
  lessonDate: string | null;
  dayOfWeek: number | null;
  lessonNumber: number;
}

interface TaughtGroup {
  id: number;
  name: string;
}

interface TeacherFormsProps {
  teacherId: string;
  groupId: number | null;
  groupName: string;
  students: Student[];
  taughtGroups?: TaughtGroup[];
}

const DAYS_OF_WEEK = ["", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

export default function TeacherForms({ teacherId, groupId, groupName, students, taughtGroups = [] }: TeacherFormsProps) {
  // Состояние активной вкладки
  const [activeTab, setActiveTab] = useState<"homework" | "grades" | "attendance">("homework");
  
  // Состояние для предметов
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  
  // Состояние для расписания
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  
  // ===== ДОМАШНЕЕ ЗАДАНИЕ =====
  const [homeworkForm, setHomeworkForm] = useState({
    scheduleId: "",
    subjectFilter: "",
    description: "",
  });
  const [savingHomework, setSavingHomework] = useState(false);
  const [homeworkMessage, setHomeworkMessage] = useState<{type: "success" | "error"; text: string} | null>(null);
  const MAX_HOMEWORK_LENGTH = 50;
  
  // Фильтр расписания по предмету для ДЗ
  const filteredScheduleForHomework = useMemo(() => {
    if (!homeworkForm.subjectFilter) return schedule;
    return schedule.filter(item => item.subjectId === parseInt(homeworkForm.subjectFilter));
  }, [schedule, homeworkForm.subjectFilter]);
  
  // Найти следующий урок того же предмета
  const getNextLessonForSubject = (currentScheduleId: string) => {
    const currentItem = schedule.find(s => s.id === parseInt(currentScheduleId));
    if (!currentItem) return null;
    
    // Находим все уроки того же предмета после текущего
    const sameSubjectLessons = schedule
      .filter(s => 
        s.subjectId === currentItem.subjectId && 
        s.id !== currentItem.id &&
        s.lessonDate &&
        currentItem.lessonDate &&
        s.lessonDate > currentItem.lessonDate
      )
      .sort((a, b) => {
        if (!a.lessonDate || !b.lessonDate) return 0;
        return new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime();
      });
    
    return sameSubjectLessons[0] || null;
  };
  
  // ===== ОЦЕНКИ =====
  const [gradeForm, setGradeForm] = useState({
    studentId: "",
    scheduleId: "",
    subjectId: "",
    value: "",
    date: new Date().toISOString().split("T")[0],
    comment: "",
  });
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeMessage, setGradeMessage] = useState<{type: "success" | "error"; text: string} | null>(null);
  
  // Фильтр расписания по предмету для оценок
  const filteredScheduleForGrades = useMemo(() => {
    if (!gradeForm.subjectId) return schedule;
    return schedule.filter(item => item.subjectId === parseInt(gradeForm.subjectId));
  }, [schedule, gradeForm.subjectId]);
  
  // ===== ОТМЕТКА ОТСУТСТВУЮЩИХ =====
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split("T")[0],
    attendance: {} as Record<string, "present" | "absent" | "unexcused">,
  });
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState<{type: "success" | "error"; text: string} | null>(null);
  
  // Загрузка предметов и расписания
  useEffect(() => {
    if (groupId) {
      // Загружаем предметы
      setLoadingSubjects(true);
      fetch(`/api/subjects?groupId=${groupId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSubjects(data);
          }
        })
        .catch(err => console.error("Ошибка загрузки предметов:", err))
        .finally(() => setLoadingSubjects(false));
      
      // Загружаем расписание
      setLoadingSchedule(true);
      const today = new Date();
      const sixMonthsAgo = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
      const threeMonthsFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      fetch(`/api/schedule?groupId=${groupId}&startDate=${sixMonthsAgo.toISOString().split("T")[0]}&endDate=${threeMonthsFromNow.toISOString().split("T")[0]}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSchedule(data);
          }
        })
        .catch(err => console.error("Ошибка загрузки расписания:", err))
        .finally(() => setLoadingSchedule(false));
    }
  }, [groupId]);
  
  // Инициализация отметок при изменении даты
  useEffect(() => {
    const initialAttendance: Record<string, "present" | "absent" | "unexcused"> = {};
    students.forEach(s => {
      initialAttendance[s.id] = "present";
    });
    setAttendanceForm(prev => ({ ...prev, attendance: initialAttendance }));
  }, [attendanceForm.date, students]);
  
  // ===== ОБРАБОТЧИКИ =====
  
  // Отправка домашнего задания
  const handleHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    
    const selectedSchedule = schedule.find(s => s.id === parseInt(homeworkForm.scheduleId));
    if (!selectedSchedule) {
      setHomeworkMessage({ type: "error", text: "Выберите урок из расписания" });
      return;
    }
    
    const nextLesson = getNextLessonForSubject(homeworkForm.scheduleId);
    
    setSavingHomework(true);
    setHomeworkMessage(null);
    
    try {
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          groupId,
          subjectId: selectedSchedule.subjectId,
          lessonDate: selectedSchedule.lessonDate,
          description: homeworkForm.description,
          dueDate: nextLesson?.lessonDate || null,
        }),
      });
      
      if (response.ok) {
        setHomeworkMessage({ 
          type: "success", 
          text: `Домашнее задание добавлено! ${nextLesson ? `Срок сдачи: ${formatDate(nextLesson.lessonDate)} (${nextLesson.subjectName})` : 'Срок сдачи не указан'}`
        });
        setHomeworkForm({
          scheduleId: "",
          subjectFilter: "",
          description: "",
        });
      } else {
        const error = await response.json();
        setHomeworkMessage({ type: "error", text: error.error || "Ошибка при сохранении" });
      }
    } catch (err) {
      setHomeworkMessage({ type: "error", text: "Ошибка сети" });
    } finally {
      setSavingHomework(false);
    }
  };
  
  // Отправка оценки
  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedSchedule = schedule.find(s => s.id === parseInt(gradeForm.scheduleId));
    const date = selectedSchedule?.lessonDate || gradeForm.date;
    
    setSavingGrade(true);
    setGradeMessage(null);
    
    try {
      const response = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: gradeForm.studentId,
          subjectId: parseInt(gradeForm.subjectId),
          teacherId,
          value: gradeForm.value,
          date: date,
          comment: gradeForm.comment || null,
        }),
      });
      
      if (response.ok) {
        setGradeMessage({ type: "success", text: "Оценка успешно выставлена!" });
        setGradeForm({
          studentId: "",
          scheduleId: "",
          subjectId: "",
          value: "",
          date: new Date().toISOString().split("T")[0],
          comment: "",
        });
      } else if (response.status === 409) {
        setGradeMessage({ type: "error", text: "Оценка уже существует на эту дату" });
      } else {
        const error = await response.json();
        setGradeMessage({ type: "error", text: error.error || "Ошибка при сохранении" });
      }
    } catch (err) {
      setGradeMessage({ type: "error", text: "Ошибка сети" });
    } finally {
      setSavingGrade(false);
    }
  };
  
  // Отправка отметок посещаемости
  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSavingAttendance(true);
    setAttendanceMessage(null);
    
    try {
      const absences = Object.entries(attendanceForm.attendance)
        .filter(([_, status]) => status !== "present")
        .map(([studentId, status]) => ({
          studentId,
          date: attendanceForm.date,
          type: status, // 'absent' или 'unexcused'
        }));
      
      // Отправляем каждое отсутствие отдельно
      const promises = absences.map(absence => 
        fetch("/api/absences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: absence.studentId,
            date: absence.date,
            type: absence.type,
          }),
        })
      );
      
      await Promise.all(promises);
      
      setAttendanceMessage({ type: "success", text: "Посещаемость отмечена!" });
    } catch (err) {
      setAttendanceMessage({ type: "error", text: "Ошибка при сохранении" });
    } finally {
      setSavingAttendance(false);
    }
  };
  
  // Форматирование даты
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  };
  
  // Получить день недели
  const getDayOfWeek = (dayOfWeek: number | null) => {
    if (!dayOfWeek) return "";
    return DAYS_OF_WEEK[dayOfWeek] || "";
  };
  
  if (!groupId) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Управление классом</h2>
          <p className="text-sm text-gray-600">Домашние задания, оценки и посещаемость</p>
        </div>
      </div>

      {/* Классы, которые ведет учитель (помимо классного руководства) */}
      {taughtGroups.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl">
          <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4-.001z" />
            </svg>
            Вы также преподаете в классах:
          </h3>
          <div className="flex flex-wrap gap-2">
            {taughtGroups.map((group) => (
              <span
                key={group.id}
                className="px-3 py-1 bg-white border-2 border-amber-300 text-amber-800 rounded-lg text-sm font-bold"
              >
                {group.name}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Вкладки */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab("homework")}
          className={`px-5 py-2.5 rounded-t-lg font-semibold transition-all ${
            activeTab === "homework"
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Домашнее задание
          </span>
        </button>
        <button
          onClick={() => setActiveTab("grades")}
          className={`px-5 py-2.5 rounded-t-lg font-semibold transition-all ${
            activeTab === "grades"
              ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Выставить оценку
          </span>
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-5 py-2.5 rounded-t-lg font-semibold transition-all ${
            activeTab === "attendance"
              ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Отметка отсутствующих
          </span>
        </button>
      </div>
      
      {/* ===== ФОРМА ДОМАШНЕГО ЗАДАНИЯ ===== */}
      {activeTab === "homework" && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">📝</span>
            Добавить домашнее задание для {groupName}
          </h3>
          
          {homeworkMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              homeworkMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"
            }`}>
              {homeworkMessage.text}
            </div>
          )}
          
          <form onSubmit={handleHomeworkSubmit} className="space-y-4">
            {/* Фильтр по предмету */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Фильтр по предмету
              </label>
              <select
                value={homeworkForm.subjectFilter}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, subjectFilter: e.target.value, scheduleId: "" })}
                className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-gray-900 font-medium"
              >
                <option value="">Все предметы</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Выбор урока из расписания */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Выберите урок из расписания <span className="text-red-500">*</span>
              </label>
              {loadingSchedule ? (
                <div className="p-4 bg-gray-50 rounded-lg text-gray-600">Загрузка расписания...</div>
              ) : filteredScheduleForHomework.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-gray-600">Нет уроков в расписании</div>
              ) : (
                <select
                  value={homeworkForm.scheduleId}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, scheduleId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-gray-900 font-medium"
                >
                  <option value="">Выберите урок</option>
                  {filteredScheduleForHomework.map((item) => (
                    <option key={item.id} value={item.id}>
                      {formatDate(item.lessonDate)} — {getDayOfWeek(item.dayOfWeek)} — {item.lessonNumber} урок — {item.subjectName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Информация о сроке сдачи */}
            {homeworkForm.scheduleId && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <p className="text-amber-800 font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Срок сдачи:
                </p>
                {(() => {
                  const nextLesson = getNextLessonForSubject(homeworkForm.scheduleId);
                  return nextLesson ? (
                    <p className="text-amber-700 mt-1">
                      {formatDate(nextLesson.lessonDate)} — {nextLesson.subjectName} ({getDayOfWeek(nextLesson.dayOfWeek)}, {nextLesson.lessonNumber} урок)
                    </p>
                  ) : (
                    <p className="text-amber-600 mt-1">Следующий урок не найден в расписании</p>
                  );
                })()}
              </div>
            )}
            
            {/* Описание задания */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Описание задания <span className="text-red-500">*</span>
                <span className="text-gray-500 font-normal ml-2">({homeworkForm.description.length}/{MAX_HOMEWORK_LENGTH})</span>
              </label>
              <textarea
                value={homeworkForm.description}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_HOMEWORK_LENGTH) {
                    setHomeworkForm({ ...homeworkForm, description: e.target.value });
                  }
                }}
                required
                rows={4}
                placeholder="Введите текст домашнего задания..."
                className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white text-gray-900 font-medium resize-none"
              />
              {homeworkForm.description.length >= MAX_HOMEWORK_LENGTH && (
                <p className="text-red-500 text-sm mt-1">Достигнуто максимальное количество символов</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={savingHomework || !homeworkForm.scheduleId}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {savingHomework ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Сохранение...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Добавить домашнее задание
                </span>
              )}
            </button>
          </form>
        </div>
      )}
      
      {/* ===== ФОРМА ВЫСТАВЛЕНИЯ ОЦЕНКИ ===== */}
      {activeTab === "grades" && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
          <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-sm">⭐</span>
            Выставить оценку
          </h3>
          
          {gradeMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              gradeMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"
            }`}>
              {gradeMessage.text}
            </div>
          )}
          
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Ученик <span className="text-red-500">*</span>
                </label>
                <select
                  value={gradeForm.studentId}
                  onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-medium"
                >
                  <option value="">Выберите ученика</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Предмет <span className="text-red-500">*</span>
                </label>
                <select
                  value={gradeForm.subjectId}
                  onChange={(e) => setGradeForm({ ...gradeForm, subjectId: e.target.value, scheduleId: "" })}
                  required
                  className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-medium"
                >
                  <option value="">Выберите предмет</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Выбор урока из расписания */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Урок из расписания
              </label>
              {loadingSchedule ? (
                <div className="p-4 bg-gray-50 rounded-lg text-gray-600">Загрузка расписания...</div>
              ) : !gradeForm.subjectId ? (
                <div className="p-4 bg-gray-50 rounded-lg text-gray-600">Сначала выберите предмет</div>
              ) : filteredScheduleForGrades.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-gray-600">Нет уроков этого предмета в расписании</div>
              ) : (
                <select
                  value={gradeForm.scheduleId}
                  onChange={(e) => {
                    const scheduleItem = schedule.find(s => s.id === parseInt(e.target.value));
                    setGradeForm({ 
                      ...gradeForm, 
                      scheduleId: e.target.value,
                      date: scheduleItem?.lessonDate || gradeForm.date
                    });
                  }}
                  className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-medium"
                >
                  <option value="">Выберите урок (или укажите дату вручную)</option>
                  {filteredScheduleForGrades.map((item) => (
                    <option key={item.id} value={item.id}>
                      {formatDate(item.lessonDate)} — {getDayOfWeek(item.dayOfWeek)} — {item.lessonNumber} урок
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Или дата вручную */}
            {!gradeForm.scheduleId && (
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Или укажите дату вручную <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={gradeForm.date}
                  onChange={(e) => setGradeForm({ ...gradeForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-medium"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                Оценка (10-балльная) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((grade) => {
                  const isSelected = gradeForm.value === grade.toString();
                  const getGradeColor = (g: number) => {
                    if (g >= 9) return "bg-emerald-500 hover:bg-emerald-600 border-emerald-600";
                    if (g >= 7) return "bg-blue-500 hover:bg-blue-600 border-blue-600";
                    if (g >= 5) return "bg-yellow-500 hover:bg-yellow-600 border-yellow-600";
                    if (g >= 4) return "bg-orange-500 hover:bg-orange-600 border-orange-600";
                    return "bg-red-500 hover:bg-red-600 border-red-600";
                  };
                  const getGradeLabel = (g: number) => {
                    if (g >= 9) return "Отлично";
                    if (g >= 7) return "Хорошо";
                    if (g >= 5) return "Удовл.";
                    if (g >= 4) return "Неуд.";
                    return "Плохо";
                  };
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setGradeForm({ ...gradeForm, value: grade.toString() })}
                      className={`relative px-4 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105 active:scale-95 shadow-md border-2 ${
                        isSelected
                          ? `${getGradeColor(grade)} ring-4 ring-offset-2 ring-${grade >= 9 ? 'emerald' : grade >= 7 ? 'blue' : grade >= 5 ? 'yellow' : grade >= 4 ? 'orange' : 'red'}-300`
                          : "bg-gray-400 hover:bg-gray-500 border-gray-500 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <span className="text-xl">{grade}</span>
                      <span className="block text-xs font-normal opacity-90">{getGradeLabel(grade)}</span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" value={gradeForm.value} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Комментарий
                </label>
                <input
                  type="text"
                  value={gradeForm.comment}
                  onChange={(e) => setGradeForm({ ...gradeForm, comment: e.target.value })}
                  placeholder="Например: контрольная работа..."
                  className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-white text-gray-900 font-medium"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={savingGrade}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {savingGrade ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Сохранение...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Выставить оценку
                </span>
              )}
            </button>
          </form>
        </div>
      )}
      
      {/* ===== ФОРМА ОТМЕТКИ ОТСУТСТВУЮЩИХ ===== */}
      {activeTab === "attendance" && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
          <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm">📋</span>
            Отметка отсутствующих
          </h3>
          
          {attendanceMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              attendanceMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"
            }`}>
              {attendanceMessage.text}
            </div>
          )}
          
          <form onSubmit={handleAttendanceSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                Дата <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={attendanceForm.date}
                onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                required
                className="w-full md:w-64 px-4 py-2.5 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white text-gray-900 font-medium"
              />
            </div>
            
            <div className="bg-white rounded-xl border-2 border-amber-200 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 p-4 bg-amber-100 font-bold text-amber-900">
                <div className="col-span-5">Ученик</div>
                <div className="col-span-7 text-center">Статус</div>
              </div>
              
              <div className="divide-y divide-amber-100">
                {students.map((student) => (
                  <div key={student.id} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-amber-50/50">
                    <div className="col-span-5 font-medium text-gray-800">
                      {student.fullName}
                    </div>
                    <div className="col-span-7 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAttendanceForm({
                          ...attendanceForm,
                          attendance: { ...attendanceForm.attendance, [student.id]: "present" }
                        })}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          attendanceForm.attendance[student.id] === "present"
                            ? "bg-green-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-green-100"
                        }`}
                      >
                        ✓ Присутствует
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceForm({
                          ...attendanceForm,
                          attendance: { ...attendanceForm.attendance, [student.id]: "absent" }
                        })}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          attendanceForm.attendance[student.id] === "absent"
                            ? "bg-yellow-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-yellow-100"
                        }`}
                      >
                        ⚠ Пропуск
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendanceForm({
                          ...attendanceForm,
                          attendance: { ...attendanceForm.attendance, [student.id]: "unexcused" }
                        })}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          attendanceForm.attendance[student.id] === "unexcused"
                            ? "bg-red-500 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-red-100"
                        }`}
                      >
                        ✗ Неуваж.
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={savingAttendance}
              className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {savingAttendance ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Сохранение...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Сохранить посещаемость
                </span>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
