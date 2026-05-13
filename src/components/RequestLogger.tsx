"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function RequestLogger() {
  const pathname = usePathname();

  useEffect(() => {
    const skipPaths = ["/_next", "/api", "/static", "/favicon"];
    if (skipPaths.some((p) => pathname.startsWith(p))) return;

    try {
      fetch("/api/request-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, method: "GET", statusCode: 200 }),
      }).catch(() => {});
    } catch {}
  }, [pathname]);

  return null;
}