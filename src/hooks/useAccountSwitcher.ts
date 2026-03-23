"use client";

import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import {
  getSavedAccounts,
  saveAccount,
  removeAccount,
  updateLastUsed,
  clearAllAccounts,
  type SavedAccount,
} from "@/lib/accounts-storage";

/**
 * Хук для переключения между сохранёнными аккаунтами
 */
export function useAccountSwitcher() {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем список аккаунтов при монтировании
  useEffect(() => {
    setAccounts(getSavedAccounts());
  }, []);

  // Переключение на другой аккаунт
  const switchToAccount = useCallback(async (email: string) => {
    const account = getSavedAccounts().find((a) => a.email === email);

    if (!account) {
      setError("Аккаунт не найден");
      return false;
    }

    setIsSwitching(true);
    setError(null);

    try {
      // Выходим из текущего аккаунта
      await authClient.signOut();

      // Входим в выбранный аккаунт
      const result = await authClient.signIn.email({
        email: account.email,
        password: account.password,
      });

      if (result.error) {
        setError("Ошибка входа в аккаунт");
        // Если пароль не подходит, удаляем аккаунт из сохранённых
        removeAccount(account.email);
        setAccounts(getSavedAccounts());
        return false;
      }

      // Обновляем время последнего использования
      updateLastUsed(account.email);
      setAccounts(getSavedAccounts());

      return true;
    } catch (err) {
      setError("Произошла ошибка при переключении");
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, []);

  // Сохранение текущего аккаунта (вызывается после успешного входа)
  const saveCurrentAccount = useCallback(
    (email: string, password: string, fullName: string, avatar?: string) => {
      saveAccount({ email, password, fullName, avatar });
      setAccounts(getSavedAccounts());
    },
    []
  );

  // Удаление аккаунта из списка
  const deleteAccount = useCallback((email: string) => {
    removeAccount(email);
    setAccounts(getSavedAccounts());
  }, []);

  // Очистка всех сохранённых аккаунтов
  const clearAll = useCallback(() => {
    clearAllAccounts();
    setAccounts([]);
  }, []);

  return {
    accounts,
    isSwitching,
    error,
    switchToAccount,
    saveCurrentAccount,
    deleteAccount,
    clearAll,
  };
}
