import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
    const session = await auth.api.getSession({
        headers: await headers(),
});

if (!session) {
    redirect("/sign-in");
}
return (
<div className="p-8">
    <h1 className="text-2xl font-bold">Добро пожаловать, {session.user.name}!</h1>
    <p className="text-gray-600">Ваш email: {session.user.email}</p>
</div>
    );
}