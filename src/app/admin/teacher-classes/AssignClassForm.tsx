"use client";

import { assignClassToTeacher } from "./actions";
import { useTransition, useState } from "react";

interface ClassGroup {
  id: number;
  name: string;
}

export default function AssignClassForm({
  teacherId,
  availableGroups,
}: {
  teacherId: string;
  availableGroups: ClassGroup[];
}) {
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const formData = new FormData();
    formData.set("teacherId", teacherId);
    formData.set("groupId", selected);
    startTransition(async () => {
      await assignClassToTeacher(formData);
    });
  };

  if (availableGroups.length === 0) {
    return <p className="text-gray-500 italic text-sm">Нет свободных классов для назначения</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input type="hidden" name="teacherId" value={teacherId} />
      <select
        name="groupId"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        disabled={availableGroups.length === 0}
        className="border-2 border-emerald-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-emerald-500 bg-white flex-1 font-medium disabled:bg-gray-100 disabled:text-gray-400"
      >
        <option value="" disabled>Выберите класс</option>
        {availableGroups.map((group) => (
          <option key={group.id} value={group.id}>
            🎓 {group.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!selected || isPending}
        className={`px-4 py-2 rounded-lg transition-all text-sm font-bold ${
          selected && !isPending
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-gray-400 text-white cursor-not-allowed"
        }`}
      >
        {isPending ? "..." : "Назначить"}
      </button>
    </form>
  );
}
