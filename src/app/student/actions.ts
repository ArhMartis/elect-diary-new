"use server";

import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";

export async function getStudentDiary(studentId: string) {
  return await db.query.user.findFirst({
    where: eq(user.id, studentId),
    with: {
      gradesReceived: {
        with: {
          subject: true,
          teacher: true,
        },
      },
    },
  });
}
