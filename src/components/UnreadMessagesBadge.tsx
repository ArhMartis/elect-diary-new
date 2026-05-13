"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function UnreadMessagesBadge() {
  const [count, setCount] = useState<number | null>(null);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (!session?.user?.id) {
      setCount(null);
      return;
    }
    fetch("/api/messages")
      .then((res) => (res.ok ? res.json() : []))
      .then((msgs) => {
        const unread = msgs.filter(
          (m: any) => m.receiverId === session.user.id && !m.readAt
        ).length;
        setCount(unread);
      })
      .catch(() => setCount(null));
  }, [session?.user?.id]);

  if (!count || count === 0) return null;

  return (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg z-10">
      {count > 99 ? "99+" : count}
    </span>
  );
}