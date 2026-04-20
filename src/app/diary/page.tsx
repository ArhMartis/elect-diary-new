import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups, grades, schedule, subjects } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";
import StudentDiaryPage from "@/components/StudentDiaryPage";
import { isTeacherHomeroomTeacher, isUserParentOfStudent } from "@/app/student/actions";

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
      return <StudentSelector currentUserId={currentUserId} userRole={userRole} />;
    }

    const student = await db.query.user.findFirst({
      where: eq(user.id, targetStudentId),
      with: {
        group: true,
      },
    });

    if (!student) {
      return <StudentSelector currentUserId={currentUserId} userRole={userRole} />;
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
      const subs = await db.select({ id: subjects.id, name: subjects.name }).from(subjects).where(eq(subjects.id, subjectIds[0]));
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

function StudentSelector({ currentUserId, userRole }: { currentUserId: string; userRole: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-2 border-emerald-200">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Выберите ученика</h2>
        <p className="text-gray-600 mb-6">
          {userRole === "admin"
            ? "Выберите класс и ученика для просмотра дневника"
            : "Выберите ученика из вашего класса"}
        </p>
        <a
          href={`/admin/diary`}
          className="block w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
        >
          Перейти к выбору
        </a>
      </div>
    </div>
  );
}
