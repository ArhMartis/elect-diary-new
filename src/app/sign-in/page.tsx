"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setError(null);

  const formData = new FormData(e.currentTarget);

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

startTransition(async () => {
  const result = await authClient.signIn.email({
    email,
    password,
  });

  // ❗ В better-auth ошибки приходят ТУТ
  if (result.error) {
    const message = result.error.message ?? "";

    if (message.includes("User not found")) {
      setError("Аккаунта с таким email не существует");
    } else if (message.includes("Invalid password")) {
      setError("Неверный пароль");
    } else {
      setError("Ошибка входа. Проверьте данные.");
    }

    return;
  }

  // успех
  window.location.assign("/");
});
}

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <form
        onSubmit={handleSubmit}
        className="card w-96 bg-base-100 shadow-xl p-6 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Вход</h2>

        {error && (
  <div className="alert alert-error text-sm animate-in fade-in slide-in-from-top">
    {error}
  </div>
)}

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="input input-bordered w-full"
          disabled={pending}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Пароль"
          className="input input-bordered w-full"
          disabled={pending}
          required
        />

        <button className="btn btn-primary w-full" disabled={pending}>
          {pending ? (
            <>
              <span className="loading loading-spinner"></span>
              Входим...
            </>
          ) : (
            "Войти"
          )}
        </button>
      </form>
    </div>
  );
}
