"use client";

import { unlinkParentFromStudent } from "./actions";

interface LinkWithUsers {
  id: number;
  parentId: string;
  parentName: string;
  parentEmail: string;
  studentId: string;
  studentName: string;
  studentGroup: string;
}

export function LinkItem({ link }: { link: LinkWithUsers }) {
  return (
    <div className="p-4 border-2 border-emerald-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all flex justify-between items-center group bg-white">
      <div className="flex items-center gap-4">
        {/* Родитель */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
            👨‍👩‍👧
          </div>
          <div>
            <p className="font-bold text-gray-800">{link.parentName}</p>
            <p className="text-sm text-gray-500">{link.parentEmail}</p>
          </div>
        </div>

        {/* Стрелка */}
        <div className="flex items-center gap-1 text-emerald-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>

        {/* Ученик */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
            🎒
          </div>
          <div>
            <p className="font-bold text-gray-800">{link.studentName}</p>
            {link.studentGroup && (
              <p className="text-sm text-purple-600 font-medium">🎓 {link.studentGroup}</p>
            )}
          </div>
        </div>
      </div>

      <form action={unlinkParentFromStudent}>
        <input type="hidden" name="linkId" value={link.id} />
        <button
          type="submit"
          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all text-sm font-medium opacity-0 group-hover:opacity-100 border border-red-200"
          onClick={(e) => {
            if (!confirm("Вы уверены, что хотите удалить эту связь?")) {
              e.preventDefault();
            }
          }}
        >
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Удалить
          </span>
        </button>
      </form>
    </div>
  );
}
