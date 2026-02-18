import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { makeAdmin } from "./actions";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";


export default async function AdminPage() {
  noStore();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.select().from(user);

return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Админ панель</h1>

      {/* Ссылка на управление предметами */}
      <div className="mb-6 flex gap-4">
  <Link
    href="/admin/subjects"
    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
  >
    Управление предметами
  </Link>

  <Link
    href="/admin/groups"
    className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
  >
    Управление классами
  </Link>
</div>
      

      <div className="space-y-4">
        {allUsers.map((user) => (
          <div
            key={user.id}
            className="p-4 border rounded flex justify-between items-center"
          >
            <div>
              <p>{user.name}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>

            {user.role !== "admin" && (
              <form action={makeAdmin}>
                <input type="hidden" name="userId" value={user.id} />
                <button className="btn btn-sm btn-primary">
                  Сделать админом
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
