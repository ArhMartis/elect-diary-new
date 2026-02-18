"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: any) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await authClient.signUp.email({
          email: formData.get("email") as string,
          password: formData.get("password") as string,
          name: formData.get("name") as string,
        });

        window.location.assign("/");
      } catch {
        setError("Ошибка регистрации");
      }
    });
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200">
      <form
        onSubmit={handleSubmit}
        className="card w-96 bg-base-100 shadow-xl p-6 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Регистрация</h2>

        {error && (
          <div className="alert alert-error text-sm">{error}</div>
        )}

        <input
          name="name"
          placeholder="Имя"
          className="input input-bordered w-full"
          disabled={pending}
          required
        />

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

        <button className="btn btn-success w-full" disabled={pending}>
          {pending ? (
            <>
              <span className="loading loading-spinner"></span>
              Создаём...
            </>
          ) : (
            "Зарегистрироваться"
          )}
        </button>
      </form>
    </div>
  );
}
