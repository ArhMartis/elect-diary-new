"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Drawer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const handleNewsClick = (e: React.MouseEvent) => {
    if (isHome) {
      e.preventDefault();
      const postsSection = document.getElementById("posts-section");
      if (postsSection) {
        postsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="drawer">
      <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        {/* Button to open drawer */}
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
          {/* Sidebar content */}
          <li className="mb-2">
            <Link href="/" className="text-lg font-medium" onClick={() => {
              const checkbox = document.getElementById("my-drawer-1") as HTMLInputElement;
              if (checkbox) checkbox.checked = false;
            }}>
              🏠 Главная
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/profile" className="text-lg font-medium" onClick={() => {
              const checkbox = document.getElementById("my-drawer-1") as HTMLInputElement;
              if (checkbox) checkbox.checked = false;
            }}>
              👤 Профиль
            </Link>
          </li>
          <li className="mb-2">
            <Link 
              href="/" 
              className="text-lg font-medium" 
              onClick={(e) => {
                handleNewsClick(e);
                const checkbox = document.getElementById("my-drawer-1") as HTMLInputElement;
                if (checkbox) checkbox.checked = false;
              }}
            >
              📰 Новости
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
