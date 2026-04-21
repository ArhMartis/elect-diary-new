"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Group {
  id: number;
  name: string;
  students: { id: string; fullName: string }[];
}

interface StudentSelectorFormProps {
  groups: Group[];
}

export default function StudentSelectorForm({ groups }: StudentSelectorFormProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  useEffect(() => {
    const savedStudentId = localStorage.getItem("lastSelectedStudentId");
    if (savedStudentId) {
      for (const group of groups) {
        const student = group.students.find(s => s.id === savedStudentId);
        if (student) {
          setSelectedGroup(group.id.toString());
          setSelectedStudent(savedStudentId);
          break;
        }
      }
    }
  }, [groups]);

  const selectedGroupData = groups.find((g) => g.id === parseInt(selectedGroup));

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    if (studentId) {
      localStorage.setItem("lastSelectedStudentId", studentId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-emerald-200">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Выбор ученика</h2>
        <p className="text-gray-600 mb-6">
          Выберите класс и ученика для заполнения дневника
        </p>

        <form action="/diary" method="GET" className="space-y-4 text-left">
          {/* Выбор класса */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Класс</label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedStudent("");
              }}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-white"
            >
              <option value="">Выберите класс</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          {/* Выбор ученика */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ученик</label>
            <select
              name="studentId"
              value={selectedStudent}
              onChange={(e) => handleStudentChange(e.target.value)}
              required
              disabled={!selectedGroup}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {selectedGroup ? "Выберите ученика" : "Сначала выберите класс"}
              </option>
              {selectedGroupData?.students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/admin"
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-center"
            >
              ← Назад
            </Link>
            <button
              type="submit"
              disabled={!selectedStudent}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Продолжить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
