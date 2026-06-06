"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function ContactAdminPage() {
  const { data: session } = authClient.useSession();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/contact-admin")
      .then(res => res.json())
      .then(data => { if (data.sent) setAlreadySent(true); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.trim() }),
      });
      if (res.ok) {
        setMessage("");
        setAlreadySent(true);
        setStatus(null);
      } else {
        const err = await res.json();
        if (res.status === 409) {
          setAlreadySent(true);
        } else {
          setStatus({ type: "error", text: err.error || "Ошибка отправки" });
        }
      }
    } catch {
      setStatus({ type: "error", text: "Не удалось отправить сообщение" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all font-medium text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            На главную
          </Link>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border-2 border-indigo-100">
          <h2 className="text-2xl font-black text-indigo-900 mb-2">Связаться с администратором</h2>
          <p className="text-indigo-600 mb-6 font-medium">
            {session?.user ? "Напишите сообщение администратору школы." : "Авторизуйтесь, чтобы отправить сообщение."}
          </p>
          {status && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {status.text}
            </div>
          )}
          {session?.user ? (
            alreadySent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-xl font-bold text-emerald-800 mb-2">Сообщение отправлено!</p>
                <p className="text-emerald-600 font-medium">Администратор свяжется с вами после прочтения.</p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Напишите ваше сообщение администратору..."
                className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white text-sm min-h-[120px] resize-none"
                required
              />
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 transition-all shadow-lg"
              >
                {sending ? "Отправка..." : "Отправить администратору"}
              </button>
            </form>
            )
          ) : (
            <Link href="/sign-in" className="inline-block w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg text-center">
              Войти
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
