"use client";

import { useState, useTransition } from "react";
import { updateFullName } from "./actions";
import type { user } from "@/db/schema/auth_schema";
import { type Role } from "@/db/schema/auth_schema";

type User = typeof user.$inferSelect;

// Перевод ролей на русский
const roleNames: Record<Role, string> = {
  admin: "Администратор",
  principal: "Директор",
  teacher: "Учитель",
  student: "Ученик",
  parent: "Родитель",
};

interface UserItemProps {
  user: User;
}

export default function UserItem({ user }: UserItemProps) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedFullName = fullName.trim();
    
    // Не позволяем отправить пустое ФИО
    if (!trimmedFullName) {
      setMessage({ type: "error", text: "ФИО не может быть пустым" });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("userId", user.id);
    formData.set("fullName", trimmedFullName);

    startTransition(async () => {
      const result = await updateFullName(formData);

      if (result?.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result?.success) {
        setMessage({ type: "success", text: result.success });
        setEditing(false);
        setTimeout(() => setMessage(null), 2000);
      }
    });
  }

  const hasEmptyFullName = !user.fullName || user.fullName.trim().length === 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-800">{user.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-gray-600">{user.email}</td>
      <td className="px-6 py-4">
        {editing ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              placeholder="Иванов Иван Иванович"
              autoFocus
            />
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setFullName(user.fullName ?? "");
              }}
              className="px-3 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400"
            >
              ✕
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${hasEmptyFullName ? "text-red-600 font-medium" : "text-gray-800"}`}>
              {user.fullName || "—"}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
              title="Редактировать ФИО"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
          user.role === "admin" ? "bg-red-100 text-red-700" :
          user.role === "teacher" ? "bg-blue-100 text-blue-700" :
          user.role === "parent" ? "bg-green-100 text-green-700" :
          user.role === "principal" ? "bg-purple-100 text-purple-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {roleNames[user.role as Role]}
        </span>
      </td>
      <td className="px-6 py-4">
        {message && (
          <span className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </span>
        )}
      </td>
    </tr>
  );
}
