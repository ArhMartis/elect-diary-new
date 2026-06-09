"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import UnreadMessagesBadge from "./UnreadMessagesBadge";

function DirectorProfileSection() {
  const [profile, setProfile] = useState<{ fullName: string; phone: string } | null>(null);
  const closeDrawer = () => { const cb = document.getElementById("my-drawer-1") as HTMLInputElement | null; if (cb) cb.checked = false; };

  useEffect(() => {
    fetch("/api/director-profile")
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(() => {});
  }, []);

  if (!profile) return null;

  return (
    <Link href="/director" onClick={closeDrawer} className="flex items-center gap-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2.5 transition-all text-left">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-bold shrink-0 text-sm">🎓</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{profile.fullName || "Директор"}</p>
        {profile.phone && <p className="text-[11px] text-white/60 truncate">{profile.phone}</p>}
      </div>
    </Link>
  );
}

export default function Drawer({ isLoggedIn, hasClass = true, userRole }: { isLoggedIn: boolean; hasClass?: boolean; userRole?: string }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { theme, resolvedTheme, setTheme } = useTheme();

  const closeDrawer = () => {
    const checkbox = document.getElementById("my-drawer-1") as HTMLInputElement | null;
    if (checkbox) {
      checkbox.checked = false;
    }
  };

  const handleNewsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    closeDrawer();
    
    // Небольшая задержка чтобы drawer успел закрыться
    setTimeout(() => {
      if (isHome) {
        // Если уже на главной - просто скроллим к новостям
        const postsSection = document.getElementById("posts-section");
        if (postsSection) {
          postsSection.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        // Если на другой странице - переходим на главную с хэшем
        window.location.href = "/#posts-section";
      }
    }, 300);
  };

  return (
    <div className="drawer">
      <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {/* Page content here */}
        <label 
          htmlFor="my-drawer-1" 
          className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all mr-2 cursor-pointer hidden md:flex"
          aria-label="Меню"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>
      </div>
      <div className="drawer-side z-[100]">
        <label htmlFor="my-drawer-1" aria-label="close sidebar" className="drawer-overlay"></label>
        
        {/* Яркий градиентный сайдбар в стиле сайта */}
        <div className="min-h-full w-80 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 flex flex-col">
          {/* Декоративные элементы */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          {/* Меню */}
          <ul className="relative z-10 space-y-2 flex-1 pt-4">
            <li>
              <Link 
                href="/" 
                onClick={closeDrawer} 
                className="flex items-center gap-3 text-lg text-white/90 hover:text-white hover:bg-white/20 rounded-xl p-3 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                Главная
              </Link>
            </li>
            <li>
              {isLoggedIn ? (
                <Link 
                  href="/profile" 
                  onClick={closeDrawer} 
                  className="flex items-center gap-3 text-lg text-white/90 hover:text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Профиль
                </Link>
              ) : (
                <div className="flex items-center gap-3 text-lg text-white/30 rounded-xl p-3 cursor-not-allowed">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="relative">Профиль<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></span>
                </div>
              )}
            </li>
            <li>
              <a 
                href="/#posts-section"
                onClick={handleNewsClick}
                className="flex items-center gap-3 text-lg text-white/90 hover:text-white hover:bg-white/20 rounded-xl p-3 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                Новости
              </a>
            </li>
            <li>
              {isLoggedIn && hasClass ? (
                <Link 
                  href="/messages" 
                  onClick={closeDrawer} 
                  className="flex items-center gap-3 text-lg text-white/90 hover:text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <UnreadMessagesBadge />
                  </div>
                  Сообщения
                </Link>
              ) : (
                <div className="flex items-center gap-3 text-lg text-white/30 rounded-xl p-3 cursor-not-allowed" title={isLoggedIn && !hasClass ? "Недоступно до назначения в класс" : undefined}>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <span className="relative">
                    Сообщения
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                </div>
              )}
            </li>
            {isLoggedIn && userRole === "student" && !hasClass && (
              <li>
                <Link 
                  href="/contact-admin" 
                  onClick={closeDrawer} 
                  className="flex items-center gap-3 text-lg text-yellow-200 hover:text-yellow-100 hover:bg-yellow-500/20 rounded-xl p-3 transition-all border border-yellow-400/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-semibold">Связаться с администратором</span>
                </Link>
              </li>
            )}
          </ul>
          
      {/* Профиль директора */}
          <div className="relative z-10 mt-4 pt-2 border-t border-white/20">
            <DirectorProfileSection />
          </div>

      {/* Нижняя часть с переключателем темы */}
          <div className="relative z-10 pt-4 space-y-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300 shrink-0">
                    <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
                  </svg>
                  <span className="text-sm font-medium text-white/90">Светлая</span>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-sm"
                  checked={theme === "dark" || (theme === "system" && resolvedTheme === "dark")}
                  onChange={() => {
                    if (theme === "light") {
                      setTheme("dark");
                    } else if (theme === "dark") {
                      setTheme("light");
                    } else {
                      setTheme(resolvedTheme === "dark" ? "light" : "dark");
                    }
                  }}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/90">Тёмная</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300 shrink-0">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                </div>
              </label>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <p className="text-white/80 text-sm text-center">
                Современная платформа для образования
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
