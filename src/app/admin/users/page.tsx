import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups } from "@/db/schema/auth_schema";
import Link from "next/link";

const roleConfig: Record<string, { name: string; color: string }> = {
  admin: { name: "Администратор", color: "bg-red-100 text-red-700" },
  principal: { name: "Директор", color: "bg-blue-100 text-blue-700" },
  teacher: { name: "Учитель", color: "bg-emerald-100 text-emerald-700" },
  student: { name: "Ученик", color: "bg-purple-100 text-purple-700" },
  parent: { name: "Родитель", color: "bg-orange-100 text-orange-700" },
};

export default async function UsersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.select().from(user);
  const groupsList = await db.select().from(groups);

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(p => p.length > 0);
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarColors = [
    "bg-gradient-to-br from-rose-400 to-rose-600",
    "bg-gradient-to-br from-emerald-400 to-emerald-600",
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-orange-400 to-orange-600",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-gray-600 hover:text-gray-800">
            ← Назад в админ-панель
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Пользователи
        </h1>

        <div className="space-y-3">
          {allUsers.map((u, index) => {
            const userGroup = u.groupId ? groupsList.find(g => g.id === u.groupId) : null;
            const roleInfo = roleConfig[u.role] || { name: u.role, color: "bg-gray-100 text-gray-700" };
            const avatarColor = avatarColors[index % avatarColors.length];

            return (
              <div key={u.id} className="p-5 border border-gray-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${avatarColor} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                      {getInitials(u.fullName)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{u.fullName}</p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${roleInfo.color}`}>
                        {roleInfo.name}
                      </span>
                      {userGroup && u.role === "student" && (
                        <span className="ml-2 text-xs text-emerald-600 font-medium">
                          • Класс: {userGroup.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
