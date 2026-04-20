import { db } from "@/db";
import { user, parentsToStudents, groups } from "@/db/schema/auth_schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { linkParentToStudent } from "./actions";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { LinkItem } from "./LinkItem";
import ParentStudentForm from "./ParentStudentForm";

export default async function ParentStudentLinksPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.select().from(user);
  const allGroups = await db.select().from(groups);
  const parents = allUsers.filter((u) => u.role === "parent");
  const students = allUsers.filter((u) => u.role === "student");

  // Получаем все существующие связи
  const allLinks = await db.select().from(parentsToStudents);

  // enrich links with parent and student data
  const linksWithUsers = await Promise.all(
    allLinks.map(async (link) => {
      const parent = allUsers.find(u => u.id === link.parentId);
      const student = allUsers.find(u => u.id === link.studentId);
      const studentGroup = student?.groupId ? allGroups.find(g => g.id === student.groupId) : null;
      return {
        ...link,
        parentName: parent?.fullName ?? "Неизвестно",
        parentEmail: parent?.email ?? "",
        studentName: student?.fullName ?? "Неизвестно",
        studentGroup: studentGroup?.name ?? "",
      };
    })
  );

  // Группируем учеников по классам
  const studentsByGroup = allGroups.map(group => ({
    ...group,
    students: students.filter(s => s.groupId === group.id).map(s => ({ id: s.id, fullName: s.fullName })),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 space-y-6">
      {/* Кнопка назад с фоном */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Назад в админ-панель
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">
          👨‍👩‍👧 Связи родителей и учеников
        </h1>
      </div>

      {/* Форма создания связи */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-emerald-100">
        <h2 className="text-lg font-semibold text-emerald-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">➕</span>
          Создать связь
        </h2>
        <ParentStudentForm groups={studentsByGroup} students={students.map(s => ({ id: s.id, fullName: s.fullName, groupId: s.groupId }))} />
      </div>

      {/* Список связей */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-emerald-100">
        <h2 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Существующие связи ({linksWithUsers.length})
        </h2>
        <div className="space-y-3">
          {linksWithUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">👨‍👩‍👧</div>
              <p className="text-gray-500">Связей еще нет</p>
            </div>
          ) : (
            linksWithUsers.map((link) => (
              <LinkItem key={link.id} link={link} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
