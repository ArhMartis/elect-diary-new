"use client";

import { useState } from "react";
import Link from "next/link";

interface Group {
  id: number;
  name: string;
  students: { id: string; fullName: string }[];
}

interface Student {
  id: string;
  fullName: string;
  groupId: number | null;
}

interface ParentStudentFormProps {
  groups: Group[];
  students: Student[];
}

export default function ParentStudentForm({ groups, students }: ParentStudentFormProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const filteredGroups = groups.filter(g => g.students.length > 0);

  return (
    <form action="/admin/parent-student-links" method="POST" className="space-y-4">
      {/* Выбор родителя */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
        <label className="block text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
          <span>👨‍👩‍👧</span> Родитель
        </label>
        <select
          name="parentId"
          required
          className="w-full border-2 border-emerald-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-white"
        >
          <option value="">Выберите родителя</option>
          {/* Родители будут загружены отдельно */}
        </select>
      </div>

      {/* Выбор класса */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
          <span>🎓</span> Класс
        </label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white"
        >
          <option value="">Выберите класс</option>
          {filteredGroups.map((group) => (
            <option key={group.id} value={group.id}>
              🎓 {group.name} ({group.students.length} учеников)
            </option>
          ))}
        </select>
      </div>

      {/* Выбор ученика */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
        <label className="block text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
          <span>🎒</span> Ученик
        </label>
        <select
          name="studentId"
          required
          className="w-full border-2 border-purple-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white"
          disabled={!selectedGroup}
        >
          <option value="">
            {selectedGroup ? "Выберите ученика" : "Сначала выберите класс"}
          </option>
          {selectedGroup &&
            groups
              .find((g) => g.id === parseInt(selectedGroup))
              ?.students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg font-bold text-lg"
      >
        ➕ Привязать ученика к родителю
      </button>
    </form>
  );
}
