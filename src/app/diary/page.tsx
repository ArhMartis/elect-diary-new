import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups, grades, schedule, subjects } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";
import StudentDiaryPage from "@/components/StudentDiaryPage";
import { isTeacherHomeroomTeacher, isUserParentOfStudent } from "@/app/student/actions";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ studentId?: string }>;
}

export default async function DiaryPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const currentUser = session.user;
  const currentUserId = currentUser.id;
  const userRole = currentUser.role || "student";

  let targetStudentId: string;
  let targetStudentName = "";
  let targetStudentGrade = "";
  let targetStudentGroupId: number | null = null;

  if (userRole === "admin" || userRole === "teacher") {
    const params = await searchParams;
    targetStudentId = params.studentId || "";

    if (!targetStudentId) {
      return <StudentSelector />;
    }

    const student = await db.query.user.findFirst({
      where: eq(user.id, targetStudentId),
      with: {
        group: true,
      },
    });

    if (!student) {
      return <StudentSelector />;
    }

    targetStudentName = student.fullName;
    targetStudentGrade = student.group?.name || "";
    targetStudentGroupId = student.groupId || null;
  } else {
    targetStudentId = currentUserId;
    targetStudentName = currentUser.fullName || "";
    const studentRecord = await db.query.user.findFirst({
      where: eq(user.id, currentUserId),
      with: { group: true },
    });
    targetStudentGrade = studentRecord?.group?.name || "";
    targetStudentGroupId = studentRecord?.groupId || null;
  }

  const isHomeroomTeacher = userRole === "teacher"
    ? await isTeacherHomeroomTeacher(currentUserId, targetStudentId)
    : false;

  const isParent = userRole === "parent"
    ? await isUserParentOfStudent(currentUserId, targetStudentId)
    : false;

  const allGrades = await db.query.grades.findMany({
    where: eq(grades.studentId, targetStudentId),
    with: {
      subject: true,
      teacher: true,
    },
    orderBy: (grades, { desc }) => [desc(grades.date)],
  });

  const allSchedule = targetStudentGroupId
    ? await db.select().from(schedule).where(eq(schedule.groupId, targetStudentGroupId))
    : [];

  const subjectMap = new Map<number, string>();
  const teacherMap = new Map<string, string>();

  if (allSchedule.length > 0) {
    const subjectIds = [...new Set(allSchedule.map((s) => s.subjectId).filter(Boolean))];
    const teacherIds = [...new Set(allSchedule.map((s) => s.teacherId).filter(Boolean))];

    if (subjectIds.length > 0) {
      for (const id of subjectIds) {
        const found = await db.query.subjects.findFirst({ where: eq(subjects.id, id) });
        if (found) subjectMap.set(id, found.name);
      }
    }

    for (const tid of teacherIds) {
      const found = await db.query.user.findFirst({ where: eq(user.id, tid) });
      if (found) teacherMap.set(tid, found.fullName);
    }
  }

  const gradesFlat = allGrades.map((g) => ({
    id: g.id,
    value: g.value,
    comment: g.comment,
    date: g.date,
    subjectName: g.subject?.name || null,
    teacherName: g.teacher?.fullName || null,
  }));

  const scheduleFlat = allSchedule.map((s) => ({
    id: s.id,
    lessonNumber: s.lessonNumber,
    subjectName: subjectMap.get(s.subjectId) || null,
    teacherName: teacherMap.get(s.teacherId) || null,
    lessonDate: s.lessonDate,
    dayOfWeek: s.dayOfWeek,
  }));

  return (
    <StudentDiaryPage
      studentId={targetStudentId}
      studentFullName={targetStudentName}
      studentGrade={targetStudentGrade}
      studentGroupId={targetStudentGroupId}
      grades={gradesFlat}
      schedule={scheduleFlat}
      currentUserId={currentUserId}
      isHomeroomTeacher={isHomeroomTeacher}
      isParent={isParent}
      userRole={userRole}
    />
  );
}

async function StudentSelector() {
  const allGroups = await db.select().from(groups);
  const allStudents = await db.select().from(user).where(eq(user.role, "student"));

  // Группируем учеников по классам
  const studentsByGroup = allGroups.map(group => ({
    ...group,
    students: allStudents.filter(s => s.groupId === group.id),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-emerald-200">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Выбор ученика</h2>
        <p className="text-gray-600 mb-6">
          Выберите класс и ученика для заполнения дневника
        </p>
        
        <form action="/diary" method="GET" className="space-y-4 text-left">
          {/* Выбор класса */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Класс</label>
            <select 
              name="groupId" 
              id="groupSelect"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-white"
              onChange={(e) => {
                const groupId = e.target.value;
                const studentSelect = document.getElementById('studentSelect') as HTMLSelectElement;
                const options = studentSelect.options;
                
                // Показываем только учеников выбранного класса
                for (let i = 0; i < options.length; i++) {
                  const option = options[i];
                  if (option.value === '') {
                    option.style.display = '';
                    continue;
                  }
                  const studentGroupId = option.getAttribute('data-group');
                  if (studentGroupId === groupId) {
                    option.style.display = '';
                  } else {
                    option.style.display = 'none';
                  }
                }
                
                // Сбрасываем выбор ученика
                studentSelect.value = '';
              }}
            >
              <option value="">Выберите класс</option>
              {studentsByGroup.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Выбор ученика */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ученик</label>
            <select 
              name="studentId" 
              id="studentSelect"
              required
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all bg-white"
            >
              <option value="">Выберите ученика</option>
              {allStudents.map((student) => (
                <option 
                  key={student.id} 
                  value={student.id}
                  data-group={student.groupId || ''}
                  style={{ display: student.groupId ? '' : 'none' }}
                >
                  {student.fullName}
                </option>
              ))}
            </select>
          </div>
          
          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/admin"
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-center"
            >
              ← Назад
            </Link>
            <button 
              type="submit"
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
            >
              Продолжить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
