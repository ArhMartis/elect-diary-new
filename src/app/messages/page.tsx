"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface Message {
  id: number;
  content: string;
  senderId: string;
  senderName: string | null;
  receiverId: string | null;
  groupId: number | null;
  isBroadcast: boolean;
  createdAt: string | number;
  readAt: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  sender?: {
    id: string;
    fullName: string | null;
    role: string;
  };
  receiver?: {
    id: string;
    fullName: string | null;
    role: string;
  };
}

interface UserGroup {
  id: string;
  fullName: string | null;
  role: string;
  groupId?: number | null;
  groupName?: string | null;
  isHomeroomTeacher?: boolean;
}

interface GroupedUsers {
  teachers: UserGroup[];
  homeroomTeachers: UserGroup[];
  admins: UserGroup[];
  principals: UserGroup[];
  students: UserGroup[];
  classmates: UserGroup[];
  parents: UserGroup[];
}

export default function MessagesPage() {
  const { data: session, isPending: loadingSession } = authClient.useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedReceiver, setSelectedReceiver] = useState<UserGroup | null>(null);
  const [groupedUsers, setGroupedUsers] = useState<GroupedUsers>({
    teachers: [],
    homeroomTeachers: [],
    admins: [],
    principals: [],
    students: [],
    classmates: [],
    parents: [],
  });
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [customSenderName, setCustomSenderName] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showConfirmClearMessages, setShowConfirmClearMessages] = useState(false);
  const [clearingMessages, setClearingMessages] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Проверка класса для учеников
  const [hasCheckedClass, setHasCheckedClass] = useState(false);
  const [userGroupId, setUserGroupId] = useState<number | null>(null);

  const userRole = session?.user?.role as string | undefined;
  const userId = session?.user?.id as string | undefined;

  // Проверяем класс ученика
  useEffect(() => {
    if (!loadingSession && session?.user && userRole === "student") {
      const groupIdFromSession = (session.user as any)?.groupId;
      if (groupIdFromSession) {
        setUserGroupId(groupIdFromSession);
        setHasCheckedClass(true);
      } else {
        fetch("/api/student/me")
          .then(res => res.json())
          .then(data => {
            setUserGroupId(data?.groupId || null);
            setHasCheckedClass(true);
          })
          .catch(() => {
            setHasCheckedClass(true);
          });
      }
    } else if (!loadingSession) {
      setHasCheckedClass(true);
    }
  }, [loadingSession, session, userRole]);

  const fetchMessages = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setError(null);
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(errorData.error || "Ошибка загрузки сообщений");
      }
    } catch (error) {
      setError("Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchAvailableUsers = useCallback(async () => {
    if (!userRole || !userId) return;
    try {
      const res = await fetch("/api/messages/users");
      if (res.ok) {
        const data = await res.json();
        setGroupedUsers(data);
      } else {
        const error = await res.json();
        console.error("Error fetching users:", error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [userRole, userId]);

  useEffect(() => {
    if (!loadingSession && userId) {
      fetchMessages();
      fetchAvailableUsers();
    }
  }, [loadingSession, userId, fetchMessages, fetchAvailableUsers]);

  // Закрыть dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Отметить сообщения как прочитанные
  useEffect(() => {
    const unreadMessages = messages.filter(
      m => m.receiverId === userId && !m.readAt
    );
    unreadMessages.forEach(async (msg) => {
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id }),
      });
    });
  }, [messages, userId]);

  // Обработка выбора файла
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка размера (10 МБ = 10 * 1024 * 1024 байт)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Файл слишком большой. Максимальный размер: 10 МБ`);
      return;
    }

    setSelectedFile(file);
  };

  // Удаление выбранного файла
  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || (!selectedReceiver && !isBroadcast)) return;

    setSending(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('content', newMessage.trim());
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      if (isBroadcast) {
        formData.append('isBroadcast', 'true');
        if (customSenderName) {
          formData.append('senderName', customSenderName);
        }
      } else if (selectedReceiver) {
        formData.append('receiverId', selectedReceiver.id);
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setNewMessage("");
        setSelectedReceiver(null);
        setIsBroadcast(false);
        setCustomSenderName("");
        setSelectedFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchMessages();
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      } else {
        const error = await res.json();
        alert(error.error || "Ошибка отправки сообщения");
      }
    } catch (error) {
      alert("Ошибка отправки сообщения");
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const formatDate = (dateValue: string | number | Date | null | undefined) => {
    if (!dateValue) return "";
    
    let date: Date;
    
    // Handle timestamp in milliseconds (from database)
    if (typeof dateValue === "number") {
      date = new Date(dateValue);
    }
    // Handle Date object
    else if (dateValue instanceof Date) {
      date = dateValue;
    }
    // Handle string
    else {
      const dateStr = String(dateValue).trim();
      
      // Handle literal "CURRENT_TIMESTAMP"
      if (dateStr === "CURRENT_TIMESTAMP") {
        date = new Date();
      }
      // Try to parse as number (timestamp)
      else if (!isNaN(Number(dateStr))) {
        date = new Date(Number(dateStr));
      }
      // Try to parse as ISO string
      else {
        date = new Date(dateStr);
        
        // If invalid, try SQLite format (2024-01-15 10:30:00)
        if (isNaN(date.getTime()) && dateStr.includes(" ") && !dateStr.includes("T")) {
          date = new Date(dateStr.replace(" ", "T") + "Z");
        }
        
        // If still invalid, try with Z suffix
        if (isNaN(date.getTime()) && !dateStr.includes("Z") && !dateStr.includes("+")) {
          date = new Date(dateStr + "Z");
        }
      }
    }
    
    // If still invalid, return original value
    if (isNaN(date.getTime())) {
      return String(dateValue);
    }
    
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSenderName = (msg: Message) => {
    if (msg.senderName) return msg.senderName;
    if (msg.sender?.fullName) return msg.sender.fullName;
    return "Неизвестный отправитель";
  };

  const getReceiverName = (msg: Message) => {
    if (msg.isBroadcast) return "Все пользователи";
    if (msg.receiver?.fullName) return msg.receiver.fullName;
    return "Неизвестный получатель";
  };

  const filteredMessages = messages.filter((msg) => {
    if (activeTab === "inbox") {
      return msg.receiverId === userId || msg.isBroadcast;
    }
    return msg.senderId === userId;
  });

  const unreadCount = messages.filter(
    m => m.receiverId === userId && !m.readAt
  ).length;

  const getAllUsers = () => {
    return [
      ...groupedUsers.admins,
      ...groupedUsers.principals,
      ...groupedUsers.homeroomTeachers,
      ...groupedUsers.teachers,
      ...groupedUsers.students,
      ...groupedUsers.classmates,
    ];
  };

  const hasAnyUsers = () => {
    return Object.values(groupedUsers).some(arr => arr.length > 0);
  };

  if (loadingSession || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-indigo-700 font-bold text-lg">Загрузка сообщений...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-3xl shadow-2xl border-2 border-red-200">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl text-red-600 font-bold mb-2">Ошибка</p>
          <p className="text-red-800 mb-6">{error}</p>
          <button 
            onClick={() => {setError(null); setLoading(true); fetchMessages();}}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!loadingSession && !session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-indigo-800 font-bold mb-4">Требуется авторизация</p>
          <Link href="/sign-in" className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg inline-block">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  // Показываем загрузку пока проверяем класс
  if (!loadingSession && hasCheckedClass === false && userRole === "student") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-indigo-700 font-bold text-lg">Проверка доступа...</p>
        </div>
      </div>
    );
  }
  
  // Блокируем доступ только если точно знаем, что ученик без класса
  if (!loadingSession && hasCheckedClass && userRole === "student" && !userGroupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-3xl shadow-2xl border-2 border-amber-300">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-2xl text-amber-800 font-bold mb-2">Доступ ограничен</p>
          <p className="text-gray-600 mb-6">Сообщения недоступны до назначения в класс. Обратитесь к администратору.</p>
          <Link 
            href="/"
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg inline-block"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const canBroadcast = userRole === "admin" || userRole === "principal";
  const canUseCustomName = userRole === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-indigo-900 mb-2">Сообщения</h1>
            <p className="text-indigo-700 font-medium">Общение между участниками образовательного процесса</p>
          </div>
          <div className="flex items-center gap-3">
            {userRole === "admin" && (
              <button
                onClick={() => setShowConfirmClearMessages(true)}
                disabled={messages.length === 0}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-bold hover:bg-red-200 transition-all border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Очистить все
              </button>
            )}
            {unreadCount > 0 && (
              <div className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold shadow-lg">
                {unreadCount} новых
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar with compose form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl shadow-xl p-6 border-2 border-indigo-100">
              <h2 className="text-2xl font-black text-indigo-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl">✏️</span>
                Новое сообщение
              </h2>
              
              <form onSubmit={handleSendMessage} className="space-y-5">
                {/* Broadcast option */}
                {canBroadcast && (
                  <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl border-2 border-amber-300">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isBroadcast}
                        onChange={(e) => {
                          setIsBroadcast(e.target.checked);
                          if (e.target.checked) setSelectedReceiver(null);
                        }}
                        className="w-6 h-6 text-amber-600 rounded-lg focus:ring-amber-500 border-2 border-amber-400"
                      />
                      <span className="font-bold text-amber-900 text-lg">📢 Отправить всем</span>
                    </label>
                  </div>
                )}

                {/* Custom sender name */}
                {canUseCustomName && isBroadcast && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-bold text-indigo-900 mb-2">
                      Отправить от имени
                    </label>
                    <input
                      type="text"
                      value={customSenderName}
                      onChange={(e) => setCustomSenderName(e.target.value)}
                      placeholder="Например: Администрация школы"
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-indigo-900"
                    />
                    <p className="text-sm text-indigo-600 mt-1 font-medium">
                      Если не указано, будет отображаться ваше имя
                    </p>
                  </div>
                )}

                {/* Receiver selection */}
                {!isBroadcast && (
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-bold text-indigo-900 mb-2">
                      Получатель
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-indigo-900 bg-white text-left flex items-center justify-between"
                    >
                      {selectedReceiver ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {selectedReceiver.fullName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <span className="font-bold block">{selectedReceiver.fullName || "Без имени"}</span>
                            <span className="text-xs text-indigo-500 font-medium">
                              {getRoleLabel(selectedReceiver.role)}
                              {selectedReceiver.isHomeroomTeacher && " (Классный руководитель)"}
                              {selectedReceiver.groupName && ` • ${selectedReceiver.groupName}`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-indigo-400">Выберите получателя...</span>
                      )}
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-indigo-400 transition-transform ${showUserDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {showUserDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border-2 border-indigo-100 max-h-80 overflow-y-auto">
                        {!hasAnyUsers() ? (
                          <div className="p-4 text-center text-indigo-400 font-medium">
                            Нет доступных получателей
                          </div>
                        ) : (
                          <>
                            {/* Администраторы */}
                            {groupedUsers.admins.length > 0 && (
                              <div className="p-2">
                                <div className="px-3 py-1 text-xs font-black text-red-600 uppercase tracking-wider">Администраторы</div>
                                {groupedUsers.admins.map(user => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => { setSelectedReceiver(user); setShowUserDropdown(false); }}
                                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                                      {user.fullName?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-indigo-900 block">{user.fullName || "Без имени"}</span>
                                      <span className="text-xs text-indigo-500 font-medium">Администратор</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Директоры */}
                            {groupedUsers.principals.length > 0 && (
                              <div className="p-2 border-t border-indigo-100">
                                <div className="px-3 py-1 text-xs font-black text-purple-600 uppercase tracking-wider">Директор</div>
                                {groupedUsers.principals.map(user => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => { setSelectedReceiver(user); setShowUserDropdown(false); }}
                                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                      {user.fullName?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-indigo-900 block">{user.fullName || "Без имени"}</span>
                                      <span className="text-xs text-indigo-500 font-medium">Директор</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Классные руководители */}
                            {groupedUsers.homeroomTeachers.length > 0 && (
                              <div className="p-2 border-t border-indigo-100">
                                <div className="px-3 py-1 text-xs font-black text-emerald-600 uppercase tracking-wider">Классные руководители</div>
                                {groupedUsers.homeroomTeachers.map(user => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => { setSelectedReceiver(user); setShowUserDropdown(false); }}
                                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold">
                                      {user.fullName?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-indigo-900 block">{user.fullName || "Без имени"}</span>
                                      <span className="text-xs text-indigo-500 font-medium">
                                        Учитель • Классный руководитель {user.groupName && `• ${user.groupName}`}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Учителя */}
                            {groupedUsers.teachers.length > 0 && (
                              <div className="p-2 border-t border-indigo-100">
                                <div className="px-3 py-1 text-xs font-black text-blue-600 uppercase tracking-wider">Учителя</div>
                                {groupedUsers.teachers.map(user => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => { setSelectedReceiver(user); setShowUserDropdown(false); }}
                                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                                      {user.fullName?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-indigo-900 block">{user.fullName || "Без имени"}</span>
                                      <span className="text-xs text-indigo-500 font-medium">Учитель</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Ученики / Одноклассники */}
                            {(groupedUsers.students.length > 0 || groupedUsers.classmates.length > 0) && (
                              <div className="p-2 border-t border-indigo-100">
                                <div className="px-3 py-1 text-xs font-black text-amber-600 uppercase tracking-wider">
                                  {groupedUsers.classmates.length > 0 ? "Одноклассники" : "Ученики"}
                                </div>
                                {[...groupedUsers.students, ...groupedUsers.classmates].map(user => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => { setSelectedReceiver(user); setShowUserDropdown(false); }}
                                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                                      {user.fullName?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-indigo-900 block">{user.fullName || "Без имени"}</span>
                                      <span className="text-xs text-indigo-500 font-medium">
                                        Ученик {user.groupName && `• ${user.groupName}`}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Родители */}
                            {groupedUsers.parents.length > 0 && (
                              <div className="p-2 border-t border-indigo-100">
                                <div className="px-3 py-1 text-xs font-black text-pink-600 uppercase tracking-wider">
                                  Родители
                                </div>
                                {groupedUsers.parents.map(user => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => { setSelectedReceiver(user); setShowUserDropdown(false); }}
                                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-sm font-bold">
                                      {user.fullName?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                    <div>
                                      <span className="font-bold text-indigo-900 block">{user.fullName || "Без имени"}</span>
                                      <span className="text-xs text-indigo-500 font-medium">
                                        Родитель {user.groupName && `• ${user.groupName}`}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Message content */}
                <div>
                  <label className="block text-sm font-bold text-indigo-900 mb-2">
                    Текст сообщения
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишите ваше сообщение..."
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-indigo-900 resize-none"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                  />
                  
                  {!selectedFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 border-2 border-dashed border-indigo-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-indigo-700 font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      📎 Прикрепить файл (до 10 МБ)
                    </button>
                  ) : (
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-bold text-indigo-900 truncate max-w-[200px]">{selectedFile.name}</p>
                            <p className="text-sm text-indigo-600">{formatFileSize(selectedFile.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Upload Progress */}
                      {sending && uploadProgress > 0 && (
                        <div className="mt-3">
                          <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-indigo-600 mt-1 text-center">{uploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sending || (!isBroadcast && !selectedReceiver) || (!newMessage.trim() && !selectedFile)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl text-lg flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                      Отправить
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info block */}
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl p-6 border-2 border-blue-300">
              <h3 className="font-black text-indigo-900 mb-4 text-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ваши права
              </h3>
              <ul className="text-indigo-800 space-y-2 font-medium">
                {userRole === "admin" && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете писать всем пользователям</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете отправлять общие объявления</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете отправлять от имени организации</span>
                    </li>
                  </>
                )}
                {userRole === "principal" && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете писать всем пользователям</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете отправлять общие объявления</span>
                    </li>
                  </>
                )}
                {userRole === "teacher" && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете писать другим учителям</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете писать директору и админу</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете писать ученикам своего класса</span>
                    </li>
                  </>
                )}
                {userRole === "student" && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете писать одноклассникам</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете писать классному руководителю</span>
                    </li>
                  </>
                )}
                {userRole === "parent" && (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Можете писать классному руководителю</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Messages list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-indigo-100 overflow-hidden h-[800px] flex flex-col">
              {/* Tabs */}
              <div className="flex border-b-2 border-indigo-100">
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`flex-1 py-5 px-6 font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === "inbox"
                      ? "text-indigo-700 border-b-4 border-indigo-500 bg-indigo-50"
                      : "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  Входящие
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("sent")}
                  className={`flex-1 py-5 px-6 font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === "sent"
                      ? "text-indigo-700 border-b-4 border-indigo-500 bg-indigo-50"
                      : "text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Отправленные
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p className="text-indigo-900 font-bold text-xl mb-2">
                      {activeTab === "inbox" ? "Входящих сообщений нет" : "Отправленных сообщений нет"}
                    </p>
                    <p className="text-indigo-600 font-medium">
                      {activeTab === "inbox" 
                        ? "У вас пока нет новых сообщений" 
                        : "Отправьте свое первое сообщение"}
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-5 rounded-2xl border-2 transition-all hover:shadow-md ${
                          !msg.readAt && msg.receiverId === userId 
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300" 
                            : "bg-white border-indigo-100"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {activeTab === "inbox" ? (
                              <>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                  {getSenderName(msg).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-indigo-900 block">
                                    {getSenderName(msg)}
                                  </span>
                                  <span className="text-sm text-indigo-600 font-medium">
                                    {msg.sender?.role && getRoleLabel(msg.sender.role)}
                                  </span>
                                </div>
                                {msg.isBroadcast && (
                                  <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs rounded-full font-bold shadow-md">
                                    Объявление
                                  </span>
                                )}
                                {!msg.readAt && msg.receiverId === userId && (
                                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                                    Новое
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                                  К
                                </div>
                                <div>
                                  <span className="font-bold text-indigo-900 block">
                                    Кому: {getReceiverName(msg)}
                                  </span>
                                  {msg.isBroadcast && (
                                    <span className="text-sm text-indigo-600 font-medium">Всем пользователям</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          <span className="text-sm text-indigo-400 font-medium whitespace-nowrap">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-indigo-900 font-medium leading-relaxed whitespace-pre-wrap pl-[52px]">{msg.content}</p>
                        
                        {/* File Attachment */}
                        {msg.fileUrl && (
                          <div className="mt-3 pl-[52px]">
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all group"
                            >
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                {msg.fileType?.startsWith('image/') ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-indigo-900 truncate max-w-[200px]">{msg.fileName || "Файл"}</p>
                                {msg.fileSize && (
                                  <p className="text-sm text-indigo-600">{formatFileSize(msg.fileSize)}</p>
                                )}
                              </div>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Подтверждение очистки сообщений */}
      {showConfirmClearMessages && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="text-xl font-extrabold text-gray-800">Удалить все сообщения?</h3>
              <p className="text-gray-500 text-sm mt-1">Это действие нельзя отменить. Все сообщения будут удалены навсегда.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClearMessages(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-bold transition-all"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  setClearingMessages(true);
                  try {
                    const res = await fetch('/api/messages', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                    });
                    if (res.ok) {
                      setMessages([]);
                      setShowConfirmClearMessages(false);
                    }
                  } catch {}
                  setClearingMessages(false);
                }}
                disabled={clearingMessages}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-300 text-sm font-bold transition-all shadow-md"
              >
                {clearingMessages ? "Удаление..." : "Удалить все"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getRoleLabel(role: string): string {
  const roles: Record<string, string> = {
    admin: "Администратор",
    principal: "Директор",
    teacher: "Учитель",
    student: "Ученик",
    parent: "Родитель",
  };
  return roles[role] || role;
}
