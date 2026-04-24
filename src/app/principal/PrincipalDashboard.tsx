"use client";

import { useState } from "react";
import Link from "next/link";

interface Teacher {
  id: string;
  fullName: string | null;
  email: string;
  isClassTeacher: boolean;
  className?: string;
  subjects: { id: number; name: string }[];
  hoursCount: number;
}

interface Student {
  id: string;
  fullName: string | null;
  email: string;
  groupId: number | null;
  groupName?: string;
}

interface Group {
  id: number;
  name: string;
  teacherId: string | null;
  teacherName?: string;
  students: Student[];
  subjects: { id: number; name: string; teacherName: string }[];
}

interface PrincipalDashboardProps {
  teachers: Teacher[];
  students: Student[];
  groups: Group[];
}

export default function PrincipalDashboard({ teachers, students, groups }: PrincipalDashboardProps) {
  const [activeView, setActiveView] = useState<"main" | "teachers" | "students" | "classes">("main");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Главный экран с тремя большими карточками
  if (activeView === "main") {
    return (
      <div className="space-y-6">
        {/* Кнопка Посты как в админке - выше трех форм */}
        <div className="flex justify-end">
          <Link
            href="/admin/posts"
            className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg font-medium text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
            </svg>
            Посты
          </Link>
        </div>

        {/* Три крупные формы */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Учителя */}
          <button
            onClick={() => setActiveView("teachers")}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl hover:scale-[1.02] transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90 font-medium">Всего учителей</p>
                <p className="text-5xl font-bold mt-2">{teachers.length}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
            <p className="text-sm opacity-80 font-medium">Нажмите для просмотра</p>
          </button>

          {/* Ученики */}
          <button
            onClick={() => setActiveView("students")}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl hover:scale-[1.02] transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90 font-medium">Всего учеников</p>
                <p className="text-5xl font-bold mt-2">{students.length}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-sm opacity-80 font-medium">Нажмите для просмотра</p>
          </button>

          {/* Классы */}
          <button
            onClick={() => setActiveView("classes")}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl hover:scale-[1.02] transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90 font-medium">Всего классов</p>
                <p className="text-5xl font-bold mt-2">{groups.length}</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-sm opacity-80 font-medium">Нажмите для просмотра</p>
          </button>
        </div>
      </div>
    );
  }

  // ВСЕ УЧИТЕЛЯ
  if (activeView === "teachers") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView("main")}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Список всех учителей</h2>
        </div>

        <div className="grid gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                    {teacher.fullName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{teacher.fullName}</h3>
                    <p className="text-gray-700 font-medium">{teacher.email}</p>
                    {teacher.isClassTeacher && (
                      <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Классный руководитель {teacher.className}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{teacher.hoursCount}</p>
                  <p className="text-sm text-gray-700 font-medium">часов в неделю</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm font-bold text-gray-800 mb-2">Ведет предметы:</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjects.length > 0 ? (
                    teacher.subjects.map((subject) => (
                      <span
                        key={subject.id}
                        className="px-3 py-1.5 bg-white border-2 border-blue-300 text-blue-800 rounded-lg text-sm font-bold"
                      >
                        {subject.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-600 italic">Предметы не назначены</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ВСЕ УЧЕНИКИ
  if (activeView === "students") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView("main")}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Список всех учеников</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {students.map((student) => (
            <div
              key={student.id}
              className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all cursor-pointer self-start"
              onClick={() => setSelectedStudent(student)}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {student.fullName?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 break-words leading-tight">{student.fullName}</h3>
                  <p className="text-gray-700 font-medium text-sm break-all mt-1">{student.email}</p>
                  <div className="mt-2">
                    {student.groupName ? (
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-bold">
                        {student.groupName}
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">
                        Без класса
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно с дневником ученика */}
        {selectedStudent && (
          <div className="fixed inset-0 backdrop-blur-md bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-2xl">
                    {selectedStudent.fullName?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedStudent.fullName}</h3>
                    <p className="text-gray-700 font-medium">{selectedStudent.groupName || "Без класса"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-800 mb-4 font-medium">Email: <span className="font-bold">{selectedStudent.email}</span></p>
                <Link
                  href={`/diary?studentId=${selectedStudent.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  Открыть дневник
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ВСЕ КЛАССЫ
  if (activeView === "classes") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView("main")}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Список всех классов</h2>
        </div>

        <div className="grid gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                    {group.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{group.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <span className="text-lg font-bold text-emerald-800">{group.students.length} учеников</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-700 font-medium">Классный руководитель:</p>
                  <p className="text-lg font-bold text-gray-900">
                    {group.teacherName || <span className="text-red-600">Не назначен</span>}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-emerald-200">
                <p className="text-sm font-bold text-gray-800 mb-2">Учителя предметов:</p>
                <div className="flex flex-wrap gap-2">
                  {group.subjects.length > 0 ? (
                    <>
                      {group.subjects.slice(0, 4).map((subject, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-white border-2 border-emerald-300 text-emerald-800 rounded-lg text-sm font-bold"
                        >
                          {subject.name} — {subject.teacherName}
                        </span>
                      ))}
                      {group.subjects.length > 4 && (
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-bold">
                          +{group.subjects.length - 4} ещё
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-600 italic">Учителя не назначены</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно с деталями класса */}
        {selectedGroup && (
          <div className="fixed inset-0 backdrop-blur-md bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                    {selectedGroup.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h3>
                    <p className="text-gray-700 font-medium">
                      Классный руководитель: {selectedGroup.teacherName || "Не назначен"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Ученики ({selectedGroup.students.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                    {selectedGroup.students.map((student) => (
                      <Link
                        key={student.id}
                        href={`/diary?studentId=${student.id}`}
                        className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-sm transition-all"
                        onClick={() => setSelectedGroup(null)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                          {student.fullName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="font-bold text-gray-900">{student.fullName}</span>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    Учителя и предметы ({selectedGroup.subjects.length})
                  </h4>
                  <div className="grid gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                    {selectedGroup.subjects.map((subject, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg"
                      >
                        <span className="font-bold text-gray-900">{subject.name}</span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-bold">
                          {subject.teacherName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
