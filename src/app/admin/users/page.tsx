import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups, subjects, teacherSubjects, parentsToStudents } from "@/db/schema/auth_schema";
import Link from "next/link";
import { eq } from "drizzle-orm";
import Image from "next/image";

// Иконки ролей
const roleIcons: Record<string, { icon: string; color: string; bgColor: string }> = {
  admin: { icon: "👑", color: "text-red-600", bgColor: "bg-red-100" },
  principal: { icon: "🎓", color: "text-blue-600", bgColor: "bg-blue-100" },
  teacher: { icon: "👨‍🏫", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  student: { icon: "🎒", color: "text-purple-600", bgColor: "bg-purple-100" },
  parent: { icon: "👨‍👩‍👧", color: "text-orange-600", bgColor: "bg-orange-100" },
};

const roleNames: Record<string, string> = {
  admin: "Администратор",
  principal: "Директор",
  teacher: "Учитель",
  student: "Ученик",
  parent: "Родитель",
};

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const allUsers = await db.select().from(user);
  const groupsList = await db.select().from(groups);
  const subjectsList = await db.select().from(subjects);
  const teacherSubjectsList = await db.select().from(teacherSubjects);
  const parentLinksList = await db.select().from(parentsToStudents);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Кнопка назад с фоном */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-rose-200 text-rose-700 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Назад в админ-панель
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          👥 Пользователи
        </h1>

        {/* Таблица пользователей */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Аватар</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Логин / Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ФИО</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Роль</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Информация</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allUsers.map((u) => {
                  const roleInfo = (u.role && roleIcons[u.role]) || { icon: "👤", color: "text-gray-600", bgColor: "bg-gray-100" };
                  const userGroup = u.groupId ? groupsList.find(g => g.id === u.groupId) : null;
                  
                  // Информация для учителя
                  let teacherInfo = "";
                  if (u.role === "teacher") {
                    const teacherSubjectIds = teacherSubjectsList
                      .filter(ts => ts.teacherId === u.id)
                      .map(ts => ts.subjectId);
                    const teacherSubjectsData = subjectsList.filter(s => teacherSubjectIds.includes(s.id));
                    const teacherClass = groupsList.find(g => g.teacherId === u.id);
                    
                    const parts = [];
                    if (teacherSubjectsData.length > 0) {
                      parts.push(`Предметы: ${teacherSubjectsData.map(s => s.name).join(", ")}`);
                    }
                    if (teacherClass) {
                      parts.push(`Классное руководство: ${teacherClass.name}`);
                    }
                    teacherInfo = parts.join(" | ");
                  }
                  
                  // Информация для ученика
                  let studentInfo = "";
                  if (u.role === "student" && userGroup) {
                    studentInfo = `Класс: ${userGroup.name}`;
                  }
                  
                  // Информация для родителя
                  let parentInfo = "";
                  if (u.role === "parent") {
                    const linkedStudents = parentLinksList
                      .filter(link => link.parentId === u.id)
                      .map(link => {
                        const student = allUsers.find(s => s.id === link.studentId);
                        const studentGroup = student?.groupId ? groupsList.find(g => g.id === student.groupId) : null;
                        return student ? `${student.fullName}${studentGroup ? ` (${studentGroup.name})` : ""}` : "";
                      })
                      .filter(Boolean);
                    
                    if (linkedStudents.length > 0) {
                      parentInfo = `Дети: ${linkedStudents.join(", ")}`;
                    } else {
                      parentInfo = "Связи не установлены";
                    }
                  }

                  return (
                    <tr key={u.id} className="hover:bg-rose-50/50 transition-colors">
                      {/* Аватар */}
                      <td className="px-4 py-3">
                        {u.avatar || u.image ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-rose-200">
                            <Image
                              src={u.avatar || u.image || ""}
                              alt={u.fullName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className={`w-12 h-12 ${roleInfo.bgColor} rounded-full flex items-center justify-center text-2xl border-2 border-gray-200`}>
                            {roleInfo.icon}
                          </div>
                        )}
                      </td>
                      
                      {/* Логин / Email */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{u.email}</p>
                        <p className="text-xs text-gray-500">{u.name}</p>
                      </td>
                      
                      {/* ФИО */}
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{u.fullName}</p>
                      </td>
                      
                      {/* Роль с иконкой */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{roleInfo.icon}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleInfo.bgColor} ${roleInfo.color}`}>
                            {(u.role && roleNames[u.role]) || u.role || "Неизвестно"}
                          </span>
                        </div>
                      </td>
                      
                      {/* Информация */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">
                          {u.role === "teacher" && teacherInfo}
                          {u.role === "student" && studentInfo}
                          {u.role === "parent" && parentInfo}
                          {(u.role === "admin" || u.role === "principal") && "—"}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
