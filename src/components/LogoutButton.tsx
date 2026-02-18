"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useTransition } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await authClient.signOut();

      router.replace("/");   // уходим на главную
      router.refresh();      // 🔥 заставляем SSR перечитать сессию
    });
  }

  return (
    <button
      onClick={handleLogout}
      className="btn btn-error"
      disabled={pending}
    >
      {pending ? (
        <span className="loading loading-spinner"></span>
      ) : (
        "Выйти"
      )}
    </button>
  );
}
