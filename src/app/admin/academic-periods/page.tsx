import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { academicPeriods, groups } from "@/db/schema/auth_schema";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import AcademicPeriodsForm from "./AcademicPeriodsForm";

export default async function AcademicPeriodsPage() {
  noStore();

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const periods = await db.select().from(academicPeriods);
  const groupsList = await db.select().from(groups);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Навигация и заголовок */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Назад к админ-панели
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Учебные четверти</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Управление учебными периодами
                </p>
              </div>
            </div>
          </div>
        </div>

        <AcademicPeriodsForm periods={periods} groupsList={groupsList} />
      </div>
    </div>
  );
}
