"use client";

import { useState } from "react";
import Link from "next/link";

export default function Drawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all mr-2"
        aria-label="Меню"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-gray-800">Меню</span>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-1">
              <Link href="/" className="block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-medium transition-colors" onClick={() => setOpen(false)}>🏠 Главная</Link>
              <Link href="/profile" className="block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-medium transition-colors" onClick={() => setOpen(false)}>👤 Профиль</Link>
              <Link href="/dashboard" className="block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-medium transition-colors" onClick={() => setOpen(false)}>📊 Панель</Link>
              <Link href="/diary" className="block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-medium transition-colors" onClick={() => setOpen(false)}>📅 Дневник</Link>
              <Link href="/posts" className="block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-medium transition-colors" onClick={() => setOpen(false)}>📰 Новости</Link>
              <hr className="my-2 border-gray-100" />
              <Link href="/admin" className="block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-medium transition-colors" onClick={() => setOpen(false)}>⚙️ Администрирование</Link>
              <Link href="/teacher" className="block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-medium transition-colors" onClick={() => setOpen(false)}>👨‍🏫 Учительская</Link>
              <Link href="/student" className="block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-medium transition-colors" onClick={() => setOpen(false)}>🎒 Ученик</Link>
              <Link href="/parent" className="block px-4 py-2.5 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg font-medium transition-colors" onClick={() => setOpen(false)}>👨‍👩‍👧‍👦 Родитель</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
