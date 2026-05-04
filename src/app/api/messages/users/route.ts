import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, groups } from "@/db/schema/auth_schema";
import { eq, and, or, not } from "drizzle-orm";
import { headers } from "next/headers";

interface UserGroup {
  id: string;
  fullName: string | null;
  role: string;
  groupId?: number | null;
  groupName?: string | null;
  isHomeroomTeacher?: boolean;
}

interface GroupedUsers {
  teachers: UserGroup[];
  homeroomTeachers: UserGroup[];
  admins: UserGroup[];
  principals: UserGroup[];
  students: UserGroup[];
  classmates: UserGroup[];
  parents: UserGroup[];
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user;
    const userRole = currentUser.role;
    const userId = currentUser.id;

    const result: GroupedUsers = {
      teachers: [],
      homeroomTeachers: [],
      admins: [],
      principals: [],
      students: [],
      classmates: [],
      parents: [],
    };

    // Получаем информацию о группе текущего пользователя
    let userGroupId: number | null = null;
    let isCurrentUserHomeroomTeacher = false;

    if (userRole === "student") {
      const studentData = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { groupId: true },
      });
      userGroupId = studentData?.groupId || null;
    } else if (userRole === "parent") {
      const { parentStudentLinks } = await import("@/db/schema/diary-extra");
      const link = await db.query.parentStudentLinks.findFirst({
        where: eq(parentStudentLinks.parentId, userId),
      });
      if (link) {
        const studentData = await db.query.user.findFirst({
          where: eq(user.id, link.studentId),
          columns: { groupId: true },
        });
        userGroupId = studentData?.groupId || null;
      }
    } else if (userRole === "teacher") {
      const teacherGroup = await db.query.groups.findFirst({
        where: eq(groups.teacherId, userId),
      });
      if (teacherGroup) {
        userGroupId = teacherGroup.id;
        isCurrentUserHomeroomTeacher = true;
      }
    }

    // Получаем всех пользователей с информацией о группах
    const allUsers = await db.select({
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      groupId: user.groupId,
    }).from(user).where(not(eq(user.id, userId)));

    // Получаем информацию о классных руководителях
    const allGroups = await db.select().from(groups);
    const homeroomTeacherIds = new Set(allGroups.map(g => g.teacherId).filter(Boolean));
    
    // Создаем мапу groupId -> groupName
    const groupMap = new Map(allGroups.map(g => [g.id, g.name]));
    
    // Создаем мапу teacherId -> groupId (для определения классных руководителей)
    const teacherGroupMap = new Map(allGroups.map(g => [g.teacherId, g.id]));

    // Обогащаем пользователей информацией
    const enrichedUsers: UserGroup[] = allUsers.map(u => ({
      ...u,
      groupName: u.groupId ? groupMap.get(u.groupId) || null : null,
      isHomeroomTeacher: u.role === "teacher" && homeroomTeacherIds.has(u.id),
    }));

    // Получаем связи родитель-ученик
    const { parentStudentLinks } = await import("@/db/schema/diary-extra");
    const allParentLinks = await db.select().from(parentStudentLinks);
    
    // Создаем мапу studentId -> parentIds
    const studentParentsMap = new Map<string, string[]>();
    allParentLinks.forEach(link => {
      if (!studentParentsMap.has(link.studentId)) {
        studentParentsMap.set(link.studentId, []);
      }
      studentParentsMap.get(link.studentId)?.push(link.parentId);
    });

    if (userRole === "admin" || userRole === "principal") {
      // Admin и Principal видят всех, сгруппированных по ролям
      result.admins = enrichedUsers.filter(u => u.role === "admin");
      result.principals = enrichedUsers.filter(u => u.role === "principal");
      result.homeroomTeachers = enrichedUsers.filter(u => u.role === "teacher" && u.isHomeroomTeacher);
      result.teachers = enrichedUsers.filter(u => u.role === "teacher" && !u.isHomeroomTeacher);
      result.students = enrichedUsers.filter(u => u.role === "student");
      result.parents = enrichedUsers.filter(u => u.role === "parent");
    } else if (userRole === "teacher") {
      // Teacher видит:
      // - Других учителей (всех)
      // - Классных руководителей (отдельно помечаем)
      // - Директора и админа
      // - Своих учеников (если классный)
      // - Родителей своих учеников (если классный)
      
      result.admins = enrichedUsers.filter(u => u.role === "admin");
      result.principals = enrichedUsers.filter(u => u.role === "principal");
      result.homeroomTeachers = enrichedUsers.filter(u => u.role === "teacher" && u.isHomeroomTeacher && u.id !== userId);
      result.teachers = enrichedUsers.filter(u => u.role === "teacher" && !u.isHomeroomTeacher);
      
      // Если классный руководитель - добавляем своих учеников и их родителей
      if (isCurrentUserHomeroomTeacher && userGroupId) {
        const classStudents = enrichedUsers.filter(u => u.role === "student" && u.groupId === userGroupId);
        result.students = classStudents;
        
        // Находим родителей учеников этого класса
        const classStudentIds = classStudents.map(s => s.id);
        const parentIdsInClass = new Set<string>();
        classStudentIds.forEach(studentId => {
          const parents = studentParentsMap.get(studentId) || [];
          parents.forEach(parentId => parentIdsInClass.add(parentId));
        });
        
        result.parents = enrichedUsers.filter(u => u.role === "parent" && parentIdsInClass.has(u.id));
      }
    } else if (userRole === "student") {
      // Student видит:
      // - Одноклассников
      // - Классного руководителя своего класса
      if (userGroupId) {
        const studentGroup = allGroups.find(g => g.id === userGroupId);
        
        // Одноклассники
        result.classmates = enrichedUsers.filter(
          u => u.role === "student" && u.groupId === userGroupId
        );
        
        // Классный руководитель
        if (studentGroup?.teacherId) {
          const homeroomTeacher = enrichedUsers.find(u => u.id === studentGroup.teacherId);
          if (homeroomTeacher) {
            result.homeroomTeachers = [homeroomTeacher];
          }
        }
      }
    } else if (userRole === "parent") {
      // Parent видит только классного руководителя
      if (userGroupId) {
        const studentGroup = allGroups.find(g => g.id === userGroupId);
        if (studentGroup?.teacherId) {
          const homeroomTeacher = enrichedUsers.find(u => u.id === studentGroup.teacherId);
          if (homeroomTeacher) {
            result.homeroomTeachers = [homeroomTeacher];
          }
        }
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    );
  }
}
