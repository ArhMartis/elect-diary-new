"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const DAY_LABELS: Record<string, string> = { monHours: "Понедельник", tueHours: "Вторник", wedHours: "Среда", thuHours: "Четверг", friHours: "Пятница", satHours: "Суббота", sunHours: "Воскресенье" };
const DAY_KEYS = ["monHours", "tueHours", "wedHours", "thuHours", "friHours", "satHours", "sunHours"];

export default function DirectorPage() {
  const { data: session } = authClient.useSession();
  const userRole = session?.user?.role;
  const userGroupId = (session?.user as any)?.groupId;
  const isRestricted = !userRole || (userRole === "student" && !userGroupId);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMsg, setContactMsg] = useState("");
  const [contactSending, setContactSending] = useState(false);

  useEffect(() => {
    fetch("/api/director-profile")
      .then(res => res.json())
      .then(data => { setProfile(data); setForm(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/director-profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { setProfile(form); setEditing(false); setMsg("Сохранено"); } else { setMsg("Ошибка"); }
    } catch { setMsg("Ошибка"); } finally { setSaving(false); }
  };

  if (isRestricted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-2 border-amber-300 dark:border-amber-700">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <p className="text-2xl text-amber-800 dark:text-amber-300 font-bold mb-2">Доступ ограничен</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Страница директора недоступна до назначения в класс. Обратитесь к администратору.</p>
          <Link href="/" className="inline-block px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg">На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-sm shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            На главную
          </Link>
          {userRole === "admin" && !editing && (
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-bold transition-all shadow-md">Редактировать</button>
          )}
        </div>

        {msg && <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${msg === 'Сохранено' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'}`}>{msg}</div>}

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300"></div></div>
        ) : profile ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border-2 border-slate-100 dark:border-gray-700">
            <div className="bg-gradient-to-r from-slate-600 to-slate-800 dark:from-gray-700 dark:to-gray-900 px-6 py-8 md:py-10 text-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">🎓</div>
              {editing ? (
                <input value={form.fullName || ""} onChange={e => setForm({...form, fullName: e.target.value})} className="text-3xl font-bold text-white text-center bg-transparent border-b-2 border-white/30 focus:outline-none focus:border-white w-full max-w-md" placeholder="ФИО директора" />
              ) : (
                <h1 className="text-3xl font-bold text-white">{profile.fullName || "Директор школы"}</h1>
              )}
              <p className="text-slate-300 dark:text-slate-400 mt-1 font-medium">Руководитель учреждения образования</p>
            </div>
            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-700/50 rounded-2xl border border-slate-200 dark:border-gray-600">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xl shrink-0">📞</div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Телефон</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile.phone || "Не указан"}</p>
                </div>
              </div>

              {userRole !== "admin" && userRole !== "principal" && (
                <button onClick={() => setShowContactForm(true)} className="w-full p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Связаться с директором
                </button>
              )}

              <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-2xl border border-slate-200 dark:border-gray-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xl shrink-0">🕐</div>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">Режим работы</p>
                </div>
                <div className="space-y-1.5 ml-15">
                  {(editing ? DAY_KEYS : DAY_KEYS.filter(d => profile[d] && profile[d] !== "выходной")).map((key) => (
                    <div key={key} className="flex items-center gap-3 text-sm">
                      <span className="w-28 font-semibold text-gray-700 dark:text-gray-300 shrink-0">{DAY_LABELS[key]}</span>
                      {editing ? (
                        <input value={form[key] || ""} onChange={e => setForm({...form, [key]: e.target.value})} className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" />
                      ) : (
                        <span className="text-gray-900 dark:text-gray-200">{profile[key]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-gray-700/50 rounded-2xl border border-slate-200 dark:border-gray-600">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xl shrink-0">📋</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Приём граждан</p>
                  {editing ? (
                    <input value={form.receptionHours || ""} onChange={e => setForm({...form, receptionHours: e.target.value})} className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 mt-1" />
                  ) : (
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile.receptionHours || "—"}</p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-all shadow-md">💾 {saving ? "Сохранение..." : "Сохранить"}</button>
                  <button onClick={() => { setEditing(false); setForm(profile); }} className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all">Отмена</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20"><p className="text-gray-500 dark:text-gray-400 font-medium">Информация о директоре не загружена</p></div>
        )}

        {showContactForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowContactForm(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">📩 Связаться с директором</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Опишите ваш вопрос. Сообщение будет отправлено директору школы.</p>
              <textarea value={contactMsg} onChange={e => setContactMsg(e.target.value)} placeholder="Ваше сообщение..." className="w-full px-4 py-3 border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:border-blue-500 focus:outline-none text-sm min-h-[100px] resize-none mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
              <div className="flex gap-3">
                <button onClick={() => setShowContactForm(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">Отмена</button>
                <button onClick={async () => {
                  if (!contactMsg.trim()) return;
                  setContactSending(true);
                  try {
                    const res = await fetch("/api/contact-director", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: contactMsg.trim() }) });
                    if (res.ok) { setContactMsg(""); setShowContactForm(false); } else { alert("Ошибка отправки"); }
                  } catch { alert("Ошибка отправки"); } finally { setContactSending(false); }
                }} disabled={contactSending || !contactMsg.trim()} className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-sm hover:from-blue-600 hover:to-indigo-700 disabled:opacity-40 transition-all">
                  {contactSending ? "Отправка..." : "Отправить"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
