"use client";

import { updateSubject, deleteSubject } from "./actions";

interface Subject {
  id: number;
  name: string;
}

export function SubjectItem({ subject }: { subject: Subject }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all flex justify-between items-center group">
      <span className="text-gray-800 font-medium">{subject.name}</span>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Форма редактирования */}
        <form action={updateSubject} className="flex gap-2">
          <input type="hidden" name="id" value={subject.id} />
          <input
            name="name"
            defaultValue={subject.name}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
            required
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 transition-all text-sm font-medium"
          >
            Обновить
          </button>
        </form>
        {/* Форма удаления */}
        <form action={deleteSubject}>
          <input type="hidden" name="id" value={subject.id} />
          <button
            type="submit"
            className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-sm font-medium"
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
    </div>
  );
}
