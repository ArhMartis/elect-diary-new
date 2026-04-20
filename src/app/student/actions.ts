"use server";

import { db } from "@/db";
import { diaryNotes, diaryVerification, parentVerification } from "@/db/schema/diary";
import { schoolContacts, schoolInfo, holidays as holidaysSchema } from "@/db/schema/diary-extra";
import { user, groups } from "@/db/schema/auth_schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// DIARY NOTES (Заметки ученика)
// ============================================================================

export async function saveDiaryNote(
  studentId: string,
  weekStart: string,
  note: string
) {
  try {
    await db
      .insert(diaryNotes)
      .values({ studentId, weekStart, note })
      .onConflictDoUpdate({
        target: [diaryNotes.studentId, diaryNotes.weekStart],
        set: { note, updatedAt: new Date() },
      });
    return { success: true };
  } catch (error) {
    console.error("Error saving diary note:", error);
    return { success: false, error: "Failed to save note" };
  }
}

export async function getDiaryNote(studentId: string, weekStart: string) {
  try {
    const note = await db.query.diaryNotes.findFirst({
      where: and(eq(diaryNotes.studentId, studentId), eq(diaryNotes.weekStart, weekStart)),
    });
    return note?.note || "";
  } catch (error) {
    console.error("Error getting diary note:", error);
    return "";
  }
}

// ============================================================================
// TEACHER VERIFICATION (Подтверждение классным руководителем)
// ============================================================================

export async function verifyDiaryWeek(
  teacherId: string,
  studentId: string,
  weekStart: string
) {
  try {
    await db.insert(diaryVerification).values({
      teacherId,
      studentId,
      weekStart,
      verifiedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error verifying diary week:", error);
    return { success: false, error: "Failed to verify" };
  }
}

export async function getDiaryVerification(studentId: string, weekStart: string) {
  try {
    const verification = await db.query.diaryVerification.findFirst({
      where: and(eq(diaryVerification.studentId, studentId), eq(diaryVerification.weekStart, weekStart)),
    });
    if (verification) {
      return {
        teacherId: verification.teacherId,
        verifiedAt: verification.verifiedAt || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting diary verification:", error);
    return null;
  }
}

// ============================================================================
// PARENT VERIFICATION (Подтверждение родителем)
// ============================================================================

export async function verifyDiaryByParent(
  parentId: string,
  studentId: string,
  weekStart: string
) {
  try {
    await db.insert(parentVerification).values({
      parentId,
      studentId,
      weekStart,
      verifiedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error verifying diary by parent:", error);
    return { success: false, error: "Failed to verify" };
  }
}

export async function getParentVerification(studentId: string, weekStart: string) {
  try {
    const verification = await db.query.parentVerification.findFirst({
      where: and(eq(parentVerification.studentId, studentId), eq(parentVerification.weekStart, weekStart)),
    });
    if (verification) {
      return {
        parentId: verification.parentId,
        verifiedAt: verification.verifiedAt || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting parent verification:", error);
    return null;
  }
}

// ============================================================================
// DIARY SETTINGS (Настройки дневника)
// ============================================================================

export async function getDiarySettings() {
  try {
    const contacts = await db.query.schoolContacts.findFirst();
    const school = await db.query.schoolInfo.findFirst();
    const holidays = await db.query.holidays.findFirst();

    return {
      academicYear: holidays?.academicYear || "",
      schoolName: contacts?.schoolName || school?.name || "",
      schoolAddress: contacts?.schoolAddress || school?.address || "",
      director: contacts?.director || "",
      directorPhone: school?.phone || "",
      vicePrincipal: contacts?.vicePrincipal || "",
      vicePrincipalPhone: "",
      vicePrincipalEdu: contacts?.vicePrincipalEdu || "",
      vicePrincipalEduPhone: "",
      homeroomTeacher: contacts?.homeroomTeacher || "",
      homeroomTeacherPhone: "",
      psychologist: contacts?.psychologist || "",
      psychologistPhone: "",
      socialPedagogue: contacts?.socialPedagogue || "",
      socialPedagoguePhone: "",
      holidays: {
        autumn: holidays?.autumnStart && holidays?.autumnEnd
          ? `${holidays.autumnStart} - ${holidays.autumnEnd}`
          : "",
        winter: holidays?.winterStart && holidays?.winterEnd
          ? `${holidays.winterStart} - ${holidays.winterEnd}`
          : "",
        spring: holidays?.springStart && holidays?.springEnd
          ? `${holidays.springStart} - ${holidays.springEnd}`
          : "",
        summer: holidays?.summerStart && holidays?.summerEnd
          ? `${holidays.summerStart} - ${holidays.summerEnd}`
          : "",
      },
    };
  } catch (error) {
    console.error("Error getting diary settings:", error);
    return null;
  }
}

// ============================================================================
// HOMEROOM TEACHER (Классный руководитель)
// ============================================================================

export async function getHomeroomTeacherByGroup(groupId: number) {
  try {
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId),
      with: {
        teacher: true,
      },
    });
    if (group?.teacher) {
      return {
        fullName: group.teacher.fullName || "",
        phone: "",
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting homeroom teacher:", error);
    return null;
  }
}

export async function isTeacherHomeroomTeacher(teacherId: string, studentId: string) {
  try {
    const student = await db.query.user.findFirst({
      where: eq(user.id, studentId),
    });
    if (!student?.groupId) return false;

    const group = await db.query.groups.findFirst({
      where: and(eq(groups.id, student.groupId), eq(groups.teacherId, teacherId)),
    });
    return !!group;
  } catch (error) {
    console.error("Error checking homeroom teacher:", error);
    return false;
  }
}

// ============================================================================
// PARENT CHECK (Проверка родителя)
// ============================================================================

export async function isUserParentOfStudent(userId: string, studentId: string) {
  try {
    const student = await db.query.user.findFirst({
      where: eq(user.id, studentId),
    });
    if (!student) return false;

    const parent = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    return parent?.role === "parent";
  } catch (error) {
    console.error("Error checking parent:", error);
    return false;
  }
}

// ============================================================================
// DIRECTOR (Директор)
// ============================================================================

export async function getDirector() {
  try {
    const director = await db.query.user.findFirst({
      where: eq(user.role, "admin"),
    });
    if (director) {
      return {
        fullName: director.fullName || "",
        phone: "",
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting director:", error);
    return null;
  }
}
