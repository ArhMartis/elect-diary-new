"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UnreadMessagesBadge from "./UnreadMessagesBadge";

const navItems = [
  {
    href: "/",
    label: "Главная",
    icon: (
      <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/diary",
    label: "Дневник",
    icon: (
      <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Сообщения",
    icon: (
      <div className="relative">
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        <UnreadMessagesBadge />
      </div>
    ),
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: (
      <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "#more",
    label: "Ещё",
    icon: (
      <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
];

export default function MobileDock() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleMore = (e: React.MouseEvent) => {
    e.preventDefault();
    const checkbox = document.getElementById("my-drawer-1") as HTMLInputElement | null;
    if (checkbox) {
      checkbox.checked = true;
    }
  };

  return (
    <div className="dock md:hidden">
      {navItems.map((item) => {
        if (item.href === "#more") {
          return (
            <button key="more" onClick={handleMore}>
              {item.icon}
              <span className="dock-label">{item.label}</span>
            </button>
          );
        }
        return (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? "dock-active" : ""}>
            {item.icon}
            <span className="dock-label">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}