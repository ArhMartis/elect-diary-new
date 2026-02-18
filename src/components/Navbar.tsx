import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import LogoutButton from "./LogoutButton";
import { unstable_noStore as noStore } from "next/cache";


export const dynamic = "force-dynamic";


export default async function Navbar() {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });


  const role = session?.user.role;

  return (
    <div className="navbar bg-base-100 shadow">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl">
          📘 School Diary
        </Link>
      </div>

      <div className="flex-none gap-2">
        {!session && (
          <>
            <Link href="/sign-in" className="btn btn-outline btn-sm">
              Вход
            </Link>
            <Link href="/sign-up" className="btn btn-primary btn-sm">
              Регистрация
            </Link>
          </>
        )}

        {session && (
          <>
            <Link href={`/${role}`} className="btn btn-ghost btn-sm">
              Дневник
            </Link>

            <span className="text-sm opacity-70">
              {session.user.email}
            </span>

            <LogoutButton />
          </>
        )}
      </div>
    </div>
  );
}
