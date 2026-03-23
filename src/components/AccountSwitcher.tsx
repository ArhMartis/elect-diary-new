"use client";

import { useState } from "react";
import { useAccountSwitcher } from "@/hooks/useAccountSwitcher";

export default function AccountSwitcher() {
  const { accounts, isSwitching, error, switchToAccount, deleteAccount } =
    useAccountSwitcher();
  const [isOpen, setIsOpen] = useState(false);

  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Кнопка переключения аккаунтов */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all disabled:opacity-50"
        title="Переключить аккаунт"
      >
        {isSwitching ? (
          <span className="loading loading-spinner loading-xs text-white"></span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        )}
      </button>

      {/* Выпадающий список аккаунтов */}
      {isOpen && (
        <>
          {/* Блокирующий фон */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden border border-gray-100">
            {/* Заголовок */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
              <h3 className="text-white font-semibold text-sm">
                Переключить аккаунт
              </h3>
              <p className="text-white/70 text-xs mt-0.5">
                {accounts.length} сохранённый{accounts.length === 1 ? "" : accounts.length < 5 ? "х" : "ов"}
              </p>
            </div>

            {/* Список аккаунтов */}
            <div className="max-h-64 overflow-y-auto">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <button
                    onClick={async () => {
                      await switchToAccount(account.email);
                      setIsOpen(false);
                    }}
                    disabled={isSwitching}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <img
                      src={account.avatar ?? "/default-avatar.png"}
                      alt={account.fullName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">
                        {account.fullName}
                      </div>
                      <div className="text-gray-500 text-xs truncate">
                        {account.email}
                      </div>
                    </div>
                  </button>

                  {/* Кнопка удаления аккаунта */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAccount(account.email);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Удалить аккаунт из списка"
                  >
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Сообщение об ошибке */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-100">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
