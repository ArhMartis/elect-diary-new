"use client";

import { unlinkParentFromStudent } from "./actions";

interface LinkWithUsers {
  id: number;
  parentId: string;
  parentName: string;
  parentEmail: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export function LinkItem({ link }: { link: LinkWithUsers }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all flex justify-between items-center group">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-emerald-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-800">{link.parentName}</p>
            <p className="text-sm text-gray-500">{link.parentEmail}</p>
          </div>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-800">{link.studentName}</p>
            <p className="text-sm text-gray-500">{link.studentEmail}</p>
          </div>
        </div>
      </div>

      <form action={unlinkParentFromStudent}>
        <input type="hidden" name="linkId" value={link.id} />
        <button
          type="submit"
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            if (!confirm("Вы уверены, что хотите удалить эту связь?")) {
              e.preventDefault();
            }
          }}
        >
          Удалить связь
        </button>
      </form>
    </div>
  );
}
