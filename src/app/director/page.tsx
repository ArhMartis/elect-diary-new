"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function DirectorPage() {
  const [profile, setProfile] = useState<{ fullName: string; phone: string; workdaysHours: string; weekendHours: string; receptionHours: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/director-profile")
      .then(res => res.json())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium text-sm shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            На главную
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-600"></div>
          </div>
        ) : profile ? (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-slate-100">
            <div className="bg-gradient-to-r from-slate-600 to-slate-800 px-6 py-8 md:py-10 text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">🎓</div>
              <h1 className="text-3xl font-bold text-white">{profile.fullName || "Директор школы"}</h1>
              <p className="text-slate-300 mt-1 font-medium">Руководитель учреждения образования</p>
            </div>
            <div className="p-6 md:p-8 space-y-5">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-xl shrink-0">📞</div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Телефон</p>
                  <p className="text-lg font-bold text-gray-900">{profile.phone || "Не указан"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-xl shrink-0">🕐</div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Режим работы</p>
                  <p className="text-lg font-bold text-gray-900">{profile.workdaysHours || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-xl shrink-0">🛌</div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Выходные дни</p>
                  <p className="text-lg font-bold text-gray-900">{profile.weekendHours || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">Информация о директоре не загружена</p>
          </div>
        )}
      </div>
    </div>
  );
}
