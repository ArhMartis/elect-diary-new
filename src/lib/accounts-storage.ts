/**
 * Утилита для управления сохранёнными аккаунтами в localStorage
 * Позволяет переключаться между аккаунтами без повторного ввода пароля
 */

export interface SavedAccount {
  id: string;
  email: string;
  password: string;
  fullName: string;
  avatar?: string;
  role?: string;
  lastUsed?: number;
}

const STORAGE_KEY = "saved_accounts";

// Получаем все сохранённые аккаунты
export function getSavedAccounts(): SavedAccount[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const accounts = JSON.parse(data) as SavedAccount[];
    // Сортируем по последнему использованию
    return accounts.sort((a, b) => (b.lastUsed ?? 0) - (a.lastUsed ?? 0));
  } catch {
    return [];
  }
}

// Сохраняем аккаунт
export function saveAccount(account: Omit<SavedAccount, "id" | "lastUsed">): void {
  if (typeof window === "undefined") return;
  
  const accounts = getSavedAccounts();
  
  // Проверяем, есть ли уже такой аккаунт
  const existingIndex = accounts.findIndex(a => a.email === account.email);
  
  const newAccount: SavedAccount = {
    ...account,
    id: account.email, // используем email как ID
    lastUsed: Date.now(),
  };
  
  if (existingIndex >= 0) {
    // Обновляем существующий
    accounts[existingIndex] = { ...accounts[existingIndex], ...newAccount };
  } else {
    // Добавляем новый
    accounts.push(newAccount);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

// Обновляем время последнего использования
export function updateLastUsed(email: string): void {
  if (typeof window === "undefined") return;
  
  const accounts = getSavedAccounts();
  const account = accounts.find(a => a.email === email);
  
  if (account) {
    account.lastUsed = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }
}

// Удаляем аккаунт
export function removeAccount(email: string): void {
  if (typeof window === "undefined") return;
  
  const accounts = getSavedAccounts();
  const filtered = accounts.filter(a => a.email !== email);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

// Очищаем все аккаунты
export function clearAllAccounts(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// Получаем аккаунт по email
export function getAccountByEmail(email: string): SavedAccount | undefined {
  const accounts = getSavedAccounts();
  return accounts.find(a => a.email === email);
}
