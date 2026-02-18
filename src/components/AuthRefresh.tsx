"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthRefresh() {
  const router = useRouter();

  useEffect(() => {
    router.refresh(); // 🔥 заставляет сервер перечитать cookie
  }, [router]);

  return null;
}
