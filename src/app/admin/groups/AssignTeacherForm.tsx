"use client";

import { assignClassTeacher } from "./actions";
import { useFormState } from "react-dom";
import { useState } from "react";

interface Teacher {
  id: string;
  fullName: string;
}

export default function AssignTeacherForm({
  groupId,
  availableTeachers,
}: {
  groupId: number;
  availableTeachers: Teacher[];
}) {
  const [selected, setSelected] = useState("");

  return (
    <form action={assignClassTeacher} className="flex gap-2 items-center">
      <input type="hidden" name="groupId" value={groupId} />
      <select
        name="teacherId"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="border-2 border-emerald-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-emerald-500 bg-white flex-1"
        required
      >
        <option value="" disabled>Выберите учителя</option>
        {availableTeachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            👨‍🏫 {teacher.fullName}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!selected}
        className={`px-4 py-2 rounded-lg transition-all text-sm font-bold ${
          selected
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-gray-400 text-white cursor-not-allowed"
        }`}
      >
        Назначить
      </button>
    </form>
  );
}
