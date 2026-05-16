"use client";

import { useState } from "react";
import { updateProfile } from "./actions";
import AvatarUploader from "@/components/AvatarUploader";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";

function ProfileClient({ user }: { user: any }) {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [verifSending, setVerifSending] = useState(false);
  const [verifSent, setVerifSent] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [totpPassword, setTotpPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [totpError, setTotpError] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [generatingBackup, setGeneratingBackup] = useState(false);

  const roleNames: Record<string, string> = {
    admin: "Администратор",
    teacher: "Учитель",
    student: "Ученик",
    parent: "Родитель",
    principal: "Директор",
  };

  const handleSendVerification = async () => {
    setVerifSending(true);
    try {
      const res = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (res.ok) setVerifSent(true);
    } catch {}
    setVerifSending(false);
  };

  const handleSetup2FA = async () => {
    if (!totpPassword) { setTotpError("Введите пароль"); return; }
    setTotpError("");
    try {
      const res = await authClient.twoFactor.getTotpUri({ password: totpPassword });
      if (res.data?.totpURI) {
        setTotpUri(res.data.totpURI);
        setShow2FA(true);
      }
    } catch { setTotpError("Ошибка получения QR-кода. Проверьте пароль."); }
  };

  const handleVerify2FA = async () => {
    if (!totpCode) return;
    setTotpVerifying(true);
    setTotpError("");
    try {
      await authClient.twoFactor.verifyTotp({ code: totpCode });
      await authClient.twoFactor.enable({ password: totpPassword });
      setShow2FA(false);
      setTotpUri("");
      setTotpCode("");
      setTotpPassword("");
      window.location.reload();
    } catch { setTotpError("Неверный код"); }
    setTotpVerifying(false);
  };

  const handleDisable2FA = async () => {
    if (!totpPassword) { setTotpError("Введите пароль"); return; }
    try {
      await authClient.twoFactor.disable({ password: totpPassword });
      setTotpPassword("");
      setBackupCodes(null);
      window.location.reload();
    } catch { setTotpError("Ошибка отключения 2FA"); }
  };

  const handleGenerateBackupCodes = async () => {
    if (!totpPassword) { setTotpError("Введите пароль для генерации кодов"); return; }
    setGeneratingBackup(true);
    try {
      const res = await authClient.twoFactor.generateBackupCodes({ password: totpPassword });
      if (res.data?.backupCodes) {
        setBackupCodes(res.data.backupCodes);
      }
    } catch { setTotpError("Ошибка генерации кодов"); }
    setGeneratingBackup(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      {showAvatarModal && user.avatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative max-w-lg max-h-[80vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center text-white"
              onClick={() => setShowAvatarModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              src={user.avatar}
              alt="Avatar"
              width={500}
              height={500}
              className="rounded-2xl shadow-2xl object-cover"
            />
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FA && totpUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={() => setShow2FA(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Настройка двухфакторной защиты</h3>
            <p className="text-sm text-gray-600 mb-4">Отсканируйте QR-код в приложении-аутентификаторе (Google Authenticator, Authy и т.п.)</p>
            <div className="flex justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`} alt="TOTP QR" className="rounded-xl" />
            </div>
            <p className="text-xs text-gray-400 mb-3 text-center break-all">Или введите ключ вручную: <code className="text-indigo-600 text-[10px]">{totpUri.split("secret=")[1]?.split("&")[0] || ""}</code></p>
            <input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="Введите код из приложения"
              className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none text-gray-900 font-medium text-center text-xl tracking-widest"
              maxLength={6}
            />
            {totpError && <p className="text-red-600 text-sm mt-2">{totpError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShow2FA(false); setTotpUri(""); setTotpPassword(""); }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">Отмена</button>
              <button onClick={handleVerify2FA} disabled={totpVerifying || totpCode.length < 6} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-40">
                {totpVerifying ? "Проверка..." : "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {backupCodes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={() => setBackupCodes(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Резервные коды</h3>
            <p className="text-sm text-gray-600 mb-4">Сохраните эти коды в надёжном месте. Они понадобятся для входа, если вы потеряете доступ к приложению-аутентификатору.</p>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="font-mono text-sm font-bold text-amber-900 bg-white rounded-lg px-3 py-2 border border-amber-200 text-center tracking-wider">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-red-600 font-medium mb-4">⚠️ Коды отображаются только один раз. Скопируйте их сейчас.</p>
            <button onClick={() => setBackupCodes(null)} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all">Закрыть</button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок и кнопка назад */}
        <div className="flex items-center gap-4">
          <Link
            href={`/${user.role}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm hover:shadow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Назад
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Мой профиль</h1>
        </div>

        {/* Основная информация */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
            Личная информация
          </h2>

          <div className="space-y-6">
            <div className="pb-6 border-b border-gray-200">
              <AvatarUploader current={user.avatar ?? undefined} />
            </div>

            {/* Форма редактирования профиля */}
            <form action={updateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Логин (имя пользователя)
                </label>
                <input
                  type="text"
                  defaultValue={user.name ?? ""}
                  disabled
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Логин нельзя изменить
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={user.email ?? ""}
                  disabled
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email нельзя изменить
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ФИО *
                </label>
                <input
                  name="fullName"
                  type="text"
                  defaultValue={user.fullName ?? ""}
                  placeholder="Иванов Иван Иванович"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Роль
                </label>
                <input
                  type="text"
                  defaultValue={roleNames[user.role as string] || user.role || ""}
                  disabled
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Информация об аккаунте
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Дата регистрации</span>
              <span className="text-gray-800 font-medium">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("ru-RU", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Email подтверждён</span>
              <div className="flex items-center gap-3">
                <span className={`font-medium ${
                  user.emailVerified ? "text-emerald-600" : "text-amber-600"
                }`}>
                  {user.emailVerified ? "Да" : "Нет"}
                </span>
                {!user.emailVerified && (
                  <button
                    onClick={handleSendVerification}
                    disabled={verifSending || verifSent}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      verifSent
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    } disabled:opacity-50`}
                  >
                    {verifSending ? "Отправка..." : verifSent ? "✓ Отправлено" : "Подтвердить"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Двухфакторная защита (2FA)</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${user.twoFactorEnabled ? "text-emerald-600" : "text-gray-400"}`}>
                  {user.twoFactorEnabled ? "Включена" : "Выключена"}
                </span>
                {!user.twoFactorEnabled ? (
                  <>
                    <input
                      type="password"
                      value={totpPassword}
                      onChange={(e) => setTotpPassword(e.target.value)}
                      placeholder="Пароль"
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <button onClick={handleSetup2FA} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-all">Настроить</button>
                  </>
                ) : (
                  <>
                    <input
                      type="password"
                      value={totpPassword}
                      onChange={(e) => setTotpPassword(e.target.value)}
                      placeholder="Пароль"
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-red-500"
                    />
                    <button onClick={handleDisable2FA} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-all">Отключить</button>
                  </>
                )}
                {totpError && <span className="text-xs text-red-600">{totpError}</span>}
              </div>
            </div>

            {user.twoFactorEnabled && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <span className="text-gray-600">Резервные коды (backup)</span>
                  {!user.emailVerified && (
                    <p className="text-xs text-amber-600 mt-0.5">Для генерации рекомендуется подтвердить email</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={totpPassword}
                    onChange={(e) => setTotpPassword(e.target.value)}
                    placeholder="Пароль"
                    className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button onClick={handleGenerateBackupCodes} disabled={generatingBackup} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all disabled:opacity-50">
                    {generatingBackup ? "..." : "Сгенерировать"}
                  </button>
                </div>
              </div>
            )}

            {user.banned && (
              <div className="flex justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Статус</span>
                <span className="text-red-600 font-medium">
                  Заблокирован {user.banReason && `(${user.banReason})`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileClient;