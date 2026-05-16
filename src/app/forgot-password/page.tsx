"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setSent(true);
      else { const d = await res.json(); setError(d.error || "Ошибка"); }
    } catch { setError("Ошибка сети"); }
    setSending(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white/95 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Проверьте почту</h1>
          <p className="text-gray-600 mb-6">Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля. Проверьте папку «Спам».</p>
          <Link href="/sign-in" className="text-indigo-600 hover:text-indigo-800 font-medium underline">Вернуться ко входу</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Восстановление пароля</h1>
          <p className="text-white/80 mt-2">Введите email, привязанный к аккаунту</p>
        </div>
        <div className="bg-white/95 rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-indigo-500 transition-all" required />
            </div>
            <button type="submit" disabled={sending || !email} className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50">
              {sending ? "Отправка..." : "Отправить ссылку"}
            </button>
            <div className="text-center">
              <Link href="/sign-in" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline">Вернуться ко входу</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
