"use client";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

const handleSignIn = async () => {
    await authClient.signIn.email({ email, password }, {
        onSuccess: () => router.push("/dashboard"),
        onError: (ctx) => alert(ctx.error.message),
    });
};

return (

    <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-md">
            <h1 className="text-2xl font-bold text-gray-900">Вход</h1>
            <input
            type="email"
            placeholder="Email"
            className="w-full rounded border p-2 text-black"
            onChange={(e) => setEmail(e.target.value)}
/>
    <input
    type="password"
    placeholder="Пароль"
    className="w-full rounded border p-2 text-black"
    onChange={(e) => setPassword(e.target.value)}
/>
<button
    onClick={handleSignIn}
        className="w-full rounded bg-blue-600 p-2 text-white hover:bg-blue-700"
>
    Войти
            </button>
        </div>
    </div>
    );
}

