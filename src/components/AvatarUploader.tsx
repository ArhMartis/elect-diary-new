"use client";

import { useState } from "react";

export default function AvatarUploader({ current }: { current?: string }) {
  const [preview, setPreview] = useState(current);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Проверяем, является ли аватар кастомным (не дефолтным)
  const isCustomAvatar = current && current !== "/default-avatar.png";

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);

    const res = await fetch("/api/upload-avatar", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (data.avatar) {
      setPreview(data.avatar);
      location.reload();
    } else {
      alert(data.error ?? "Upload error");
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative cursor-pointer" onClick={() => isCustomAvatar && setShowModal(true)}>
          <img
            src={preview ?? "/default-avatar.png"}
            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 shadow-lg hover:opacity-90 transition-opacity"
          />
          {isCustomAvatar && (
            <div className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/10 flex items-center justify-center transition-all">
              <svg className="w-6 h-6 text-white opacity-0 hover:opacity-100 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          )}
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Загрузка...
            </span>
          ) : (
            "Сменить аватар"
          )}
          <input type="file" hidden accept="image/*" onChange={handleChange} />
        </label>
      </div>

      {/* Модальное окно для просмотра аватара */}
      {showModal && isCustomAvatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center"
              onClick={() => setShowModal(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={preview ?? "/default-avatar.png"}
              className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain"
              alt="Avatar preview"
            />
          </div>
        </div>
      )}
    </>
  );
}
