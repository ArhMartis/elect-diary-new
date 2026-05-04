"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Drawer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const handleNewsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isHome) {
      e.preventDefault();
      closeDrawer();
      // Небольшая задержка чтобы drawer успел закрыться
      setTimeout(() => {
        const postsSection = document.getElementById("posts-section");
        if (postsSection) {
          postsSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    }
    // Если не на главной, просто переходим на главную (Link сработает по умолчанию)
  };

  const closeDrawer = () => {
    const checkbox = document.getElementById("my-drawer-1") as HTMLInputElement | null;
    if (checkbox) {
      checkbox.checked = false;
    }
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
        <ul className="menu bg-base-200 min-h-full w-80 p-4">
          {/* Sidebar content here */}
          <li>
            <Link href="/" onClick={closeDrawer} className="flex items-center gap-3 text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Главная
            </Link>
          </li>
          <li>
            <Link href="/profile" onClick={closeDrawer} className="flex items-center gap-3 text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Профиль
            </Link>
          </li>
          <li>
            <Link 
              href="/" 
              onClick={(e) => {
                handleNewsClick(e);
                closeDrawer();
              }}
              className="flex items-center gap-3 text-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Новости
            </Link>
          </li>
          <li>
            <Link href="/messages" onClick={closeDrawer} className="flex items-center gap-3 text-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Сообщения
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
