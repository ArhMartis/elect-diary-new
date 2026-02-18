"use server";

import { db } from "@/db";
import { schedule } from "@/db/schema/auth_schema";

export async function assignSubject(formData: FormData) {
  await db.insert(schedule).values({
    teacherId: formData.get("teacherId") as string,
    subjectId: Number(formData.get("subjectId")),
    groupId: Number(formData.get("groupId")),
    dayOfWeek: 1,
    lessonNumber: 1,
  });
}
