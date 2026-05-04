import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, groups, grades, schedule, subjects, groupSubjects } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";
import StudentDiaryPage from "@/components/StudentDiaryPage";
import { isTeacherHomeroomTeacher, isUserParentOfStudent, getDirector, getHomeroomTeacherByGroup, getDiarySettings } from "@/app/student/actions";
import StudentSelectorForm from "./StudentSelectorForm";

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
  let targetStudentAvatar = "";

  if (userRole === "admin" || userRole === "teacher" || userRole === "principal") {
    const params = await searchParams;
    targetStudentId = params.studentId || "";

    if (!targetStudentId) {
      // Загружаем данные для формы выбора
      const allGroups = await db.select().from(groups);
      const allStudents = await db.select().from(user).where(eq(user.role, "student"));
      
      const groupsWithStudents = allGroups.map(group => ({
        id: group.id,
        name: group.name,
        students: allStudents
          .filter(s => s.groupId === group.id)
          .map(s => ({ id: s.id, fullName: s.fullName })),
      }));

      return <StudentSelectorForm groups={groupsWithStudents} />;
    }

    const student = await db.query.user.findFirst({
      where: eq(user.id, targetStudentId),
      with: {
        group: true,
      },
    });

    if (!student) {
      // Если ученик не найден, показываем форму выбора
      const allGroups = await db.select().from(groups);
      const allStudents = await db.select().from(user).where(eq(user.role, "student"));
      
      const groupsWithStudents = allGroups.map(group => ({
        id: group.id,
        name: group.name,
        students: allStudents
          .filter(s => s.groupId === group.id)
          .map(s => ({ id: s.id, fullName: s.fullName })),
      }));

      return <StudentSelectorForm groups={groupsWithStudents} />;
    }

    targetStudentName = student.fullName;
    targetStudentGrade = student.group?.name || "";
    targetStudentGroupId = student.groupId || null;
    targetStudentAvatar = student.avatar || student.image || "";
  } else {
    targetStudentId = currentUserId;
    targetStudentName = currentUser.fullName || "";
    const studentRecord = await db.query.user.findFirst({
      where: eq(user.id, currentUserId),
      with: { group: true },
    });
    targetStudentGrade = studentRecord?.group?.name || "";
    targetStudentGroupId = studentRecord?.groupId || null;
    targetStudentAvatar = studentRecord?.avatar || studentRecord?.image || "";
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
    const teacherIds = [...new Set(allSchedule.map((s) => s.teacherId).filter((t): t is string => t !== null))];

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
    teacherName: s.teacherId ? (teacherMap.get(s.teacherId) ?? null) : null,
    lessonDate: s.lessonDate,
    dayOfWeek: s.dayOfWeek,
    quarter: s.quarter,
  }));

  const directorData = await getDirector();
  const homeroomTeacherData = targetStudentGroupId
    ? await getHomeroomTeacherByGroup(targetStudentGroupId)
    : null;
  const diarySettings = await getDiarySettings();

  const effectiveDirector = directorData?.fullName || diarySettings?.director || "";
  // Если классный руководитель найден для группы (teacherId назначен), используем его имя (даже пустое)
  // иначе fallback на общие настройки
  // null означает - для группы не назначен классный руководитель
  // "" (пустая строка) означает - назначен, но имя не заполнено
  const effectiveHomeroomTeacher = homeroomTeacherData 
    ? homeroomTeacherData.fullName  // может быть "" если имя не заполнено
    : (diarySettings?.homeroomTeacher || null);  // null если не назначен вообще
  const effectiveHomeroomTeacherPhone = homeroomTeacherData
    ? homeroomTeacherData.phone  // может быть "" 
    : (diarySettings?.homeroomTeacherPhone || null);

  // Получаем названия предметов из расписания
  const classSubjectNames = [...new Set(
    allSchedule
      .map(s => subjectMap.get(s.subjectId))
      .filter(Boolean) as string[]
  )];

  // Получаем названия мероприятий (классный час, события) для зеленой подсветки
  let eventSubjectNames: string[] = [];
  try {
    const eventSubjectsData = await db.select().from(subjects).where(eq(subjects.type, 'class_hour'));
    const eventItemsData = await db.select().from(subjects).where(eq(subjects.type, 'event'));
    eventSubjectNames = [...eventSubjectsData, ...eventItemsData].map(s => s.name);
  } catch {
    eventSubjectNames = [];
  }

  // Получаем названия предметов из groupSubjects (привязка предметов к классу)
  let filteredSubjectNames: string[] = [];
  
  if (targetStudentGroupId) {
    const groupSubjectRows = await db.select().from(groupSubjects).where(eq(groupSubjects.groupId, targetStudentGroupId));
    const groupSubjectIds = groupSubjectRows.map(gs => gs.subjectId);
    
    if (groupSubjectIds.length > 0) {
      const uniqueIds = [...new Set(groupSubjectIds)];
      for (const sid of uniqueIds) {
        const found = await db.query.subjects.findFirst({ where: eq(subjects.id, sid) });
        if (found) filteredSubjectNames.push(found.name);
      }
    }
    
    // Добавляем предметы из расписания
    if (classSubjectNames.length > 0) {
      filteredSubjectNames.push(...classSubjectNames);
    }
    
    // Если ничего нет, загружаем все предметы
    if (filteredSubjectNames.length === 0) {
      const allSubjectsData = await db.select().from(subjects);
      filteredSubjectNames = allSubjectsData.map(s => s.name);
    }
  } else {
    // Если нет groupId, используем предметы из расписания
    filteredSubjectNames = classSubjectNames;
  }

  filteredSubjectNames = [...new Set(filteredSubjectNames)];

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
      initialDirectorName={effectiveDirector}
      initialHomeroomTeacherName={effectiveHomeroomTeacher}
      initialHomeroomTeacherPhone={effectiveHomeroomTeacherPhone}
      initialSchoolName={diarySettings?.schoolName || ""}
      initialSchoolAddress={diarySettings?.schoolAddress || ""}
      classSubjectNames={filteredSubjectNames}
      eventSubjectNames={eventSubjectNames}
      initialContacts={diarySettings ? {
        director: effectiveDirector || diarySettings.director,
        directorPhone: diarySettings.directorPhone,
        vicePrincipal: diarySettings.vicePrincipal,
        vicePrincipalPhone: diarySettings.vicePrincipalPhone,
        vicePrincipalEdu: diarySettings.vicePrincipalEdu,
        vicePrincipalEduPhone: diarySettings.vicePrincipalEduPhone,
        // Классный руководитель берется только из данных группы, без fallback на общие настройки
        homeroomTeacher: effectiveHomeroomTeacher,
        homeroomTeacherPhone: effectiveHomeroomTeacherPhone,
        psychologist: diarySettings.psychologist,
        psychologistPhone: diarySettings.psychologistPhone,
        socialPedagogue: diarySettings.socialPedagogue,
        socialPedagoguePhone: diarySettings.socialPedagoguePhone,
      } : undefined}
      initialHolidays={diarySettings?.holidays}
      userAvatar={targetStudentAvatar}
    />
  );
}
