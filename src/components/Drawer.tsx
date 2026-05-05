"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Drawer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

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
          className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all mr-2 cursor-pointer"
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
              {isLoggedIn ? (
                <Link 
                  href="/messages" 
                  onClick={closeDrawer} 
                  className="flex items-center gap-3 text-lg text-white/90 hover:text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  Сообщения
                </Link>
              ) : (
                <div className="flex items-center gap-3 text-lg text-white/30 rounded-xl p-3 cursor-not-allowed">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <span className="relative">Сообщения<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></span>
                </div>
              )}
            </li>
          </ul>
          
          {/* Нижняя часть с декоративным элементом */}
          <div className="relative z-10 mt-auto pt-6">
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
