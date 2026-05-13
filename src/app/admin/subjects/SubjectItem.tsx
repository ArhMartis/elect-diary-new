"use client";

import { useState } from "react";
import { assignTeacherToSubject, removeTeacherFromSubject, updateSubject, deleteSubject } from "./actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface Subject {
  id: number;
  name: string;
  teacherId: string | null;
  type?: string | null;
}

interface Teacher {
  id: string;
  name: string;
  fullName: string;
}

interface TeacherSubject {
  id: number;
  teacherId: string;
  subjectId: number;
}

interface SubjectItemProps {
  subject: Subject;
  teachers: Teacher[];
  teacherSubjects: TeacherSubject[];
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export function SubjectItem({
  subject,
  teachers,
  teacherSubjects,
  onShowToast
}: SubjectItemProps) {
  const [isTeachersOpen, setIsTeachersOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  // Получаем IDs учителей, закреплённых за ЭТИМ предметом (исправлено - было для всех предметов)
  const subjectTeacherSubjects = teacherSubjects.filter(ts => ts.subjectId === subject.id);
  const assignedTeacherIds = new Set(subjectTeacherSubjects.map(ts => ts.teacherId));
  const assignedTeachersCount = assignedTeacherIds.size;
  
  const isLockedSubject = subject.type === 'class_hour' || subject.type === 'event';
  
  const handleAssignTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await assignTeacherToSubject(formData);
        onShowToast("Учитель закреплён за предметом", 'success');
        router.refresh();
      } catch (error) {
        onShowToast("Ошибка при закреплении учителя", 'error');
      }
    });
  };

  const handleRemoveTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Проверяем, не является ли это последним учителем
    if (assignedTeachersCount <= 1) {
      onShowToast("Должен быть хоть один учитель, закреплённый за предметом!", 'error');
      return;
    }

    // Отправляем форму вручную
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await removeTeacherFromSubject(formData);
        onShowToast("Учитель откреплён от предмета", 'success');
        router.refresh();
      } catch (error) {
        onShowToast("Ошибка при откреплении учителя", 'error');
      }
    });
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all">
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-gray-800 dark:text-gray-100 font-medium text-lg">{subject.name}</span>
          {!isLockedSubject && (
            <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full font-medium">
              {assignedTeacherIds.size} учител{assignedTeacherIds.size === 1 ? 'ь' : assignedTeacherIds.size < 5 ? 'я' : 'ей'}
            </span>
          )}
        </div>
        
        {/* Кнопки редактирования и удаления предмета */}
        {!isLockedSubject && (
          <div className="flex gap-2 flex-wrap">
            {/* Форма редактирования */}
            <form action={updateSubject} className="flex gap-2 items-center">
              <input type="hidden" name="id" value={subject.id} />
              <input
                name="name"
                defaultValue={subject.name}
                className="border border-gray-300 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100 rounded px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-500 w-32 md:w-40"
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 transition-all text-sm font-medium whitespace-nowrap"
              >
                Обновить
              </button>
            </form>
            {/* Форма удаления */}
            <form action={deleteSubject}>
              <input type="hidden" name="id" value={subject.id} />
              <button
                type="submit"
                className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-sm font-medium whitespace-nowrap"
                onClick={(e) => {
                  if (!confirm("Вы уверены, что хотите удалить этот предмет?")) {
                    e.preventDefault();
                  }
                }}
              >
                Удалить
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Справочник учителей для этого предмета - каруселька с анимацией */}
      {subject.type !== 'event' && subject.type !== 'class_hour' && subject.type !== 'olympiad' && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Заголовок-переключатель */}
          <button
            onClick={() => setIsTeachersOpen(!isTeachersOpen)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Учителя, ведущие этот предмет:
              <span className="text-xs font-normal text-gray-500">
                ({assignedTeacherIds.size} закреплено)
              </span>
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {isTeachersOpen ? 'Скрыть' : 'Показать'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isTeachersOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </button>
          
          {/* Анимированный контент */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isTeachersOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
<div className="p-4 pt-0 space-y-2">
               {[...teachers].sort((a, b) => {
                 const aAssigned = assignedTeacherIds.has(a.id);
                 const bAssigned = assignedTeacherIds.has(b.id);
                 if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
                 return a.fullName.localeCompare(b.fullName, 'ru');
               }).map((teacher) => {
                 const isAssigned = assignedTeacherIds.has(teacher.id);
                 
                 return (
                  <div 
                    key={teacher.id}
                    className={`flex justify-between items-center p-3 rounded-lg transition-all ${
                      isAssigned 
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700' 
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                          {teacher.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className={`font-medium ${isAssigned ? 'text-emerald-800 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200'}`}>
                          {teacher.fullName}
                        </span>
                        {isAssigned && (
                          <p className="text-xs text-emerald-600">Закреплён за предметом</p>
                        )}
                      </div>
                    </div>

                    {/* Кнопка +/- */}
                    {isAssigned ? (
                      <form 
                        key={`remove-${subject.id}-${teacher.id}`}
                        onSubmit={handleRemoveTeacher}
                        className="inline-block"
                      >
                        <input type="hidden" name="teacherId" value={teacher.id} />
                        <input type="hidden" name="subjectId" value={subject.id} />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                          title="Открепить предмет"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </form>
                    ) : (
                      <form 
                        key={`assign-${subject.id}-${teacher.id}`}
                        onSubmit={handleAssignTeacher}
                        className="inline-block"
                      >
                        <input type="hidden" name="teacherId" value={teacher.id} />
                        <input type="hidden" name="subjectId" value={subject.id} />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                          title="Закрепить предмет"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
              
              {teachers.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  В системе нет учителей
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
