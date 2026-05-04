"use client";

import { useTransition } from "react";
import { logout } from "@/app/actions";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout(false);
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
