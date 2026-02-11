"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";


export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSignUp = async () => {
    await authClient.signUp.email(
      {
        email,
        password,
        name,
      },
      {
        onSuccess: () => {
          alert("Успех! Аккаунт создан");
        },
        onError: (ctx) => {
          alert(ctx.error.message);
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>

        <input
          className="w-full rounded border p-2 text-black"
          placeholder="Имя"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full rounded border p-2 text-black"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded border p-2 text-black"
          type="password"
          placeholder="Пароль"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignUp}
          className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700"
        >
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
}
