import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { messages } from "@/db/schema/messages";
import { user, groups } from "@/db/schema/auth_schema";
import { eq, or, and, desc, isNull, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { writeFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ

// GET - получить сообщения для текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user;
    const userRole = currentUser.role;
    const userId = currentUser.id;

    // Получаем информацию о группе пользователя
    let userGroupId: number | null = null;
    let homeroomTeacherId: string | null = null;

    if (userRole === "student") {
      const studentData = await db.query.user.findFirst({
        where: eq(user.id, userId),
        columns: { groupId: true },
      });
      userGroupId = studentData?.groupId || null;
    } else if (userRole === "parent") {
      const { parentsToStudents } = await import("@/db/schema/auth_schema");
      const link = await db.query.parentsToStudents.findFirst({
        where: eq(parentsToStudents.parentId, userId),
      });
      if (link) {
        const studentData = await db.query.user.findFirst({
          where: eq(user.id, link.studentId),
          columns: { groupId: true },
        });
        userGroupId = studentData?.groupId || null;
      }
    } else if (userRole === "teacher") {
      const groupData = await db.query.groups.findFirst({
        where: eq(groups.teacherId, userId),
      });
      userGroupId = groupData?.id || null;
    }

    if (userGroupId) {
      const groupData = await db.query.groups.findFirst({
        where: eq(groups.id, userGroupId),
      });
      homeroomTeacherId = groupData?.teacherId || null;
    }

    // Строим условия запроса
    let whereConditions: any[] = [];

    if (userRole === "admin" || userRole === "principal") {
      whereConditions = [
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId),
          eq(messages.isBroadcast, true)
        )
      ];
    } else if (userRole === "teacher") {
      const otherTeachers = await db.select({ id: user.id }).from(user).where(eq(user.role, "teacher"));
      const teacherIds = otherTeachers.map(t => t.id);
      
      const principals = await db.select({ id: user.id }).from(user).where(eq(user.role, "principal"));
      const principalIds = principals.map(p => p.id);
      
      const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, "admin"));
      const adminIds = admins.map(a => a.id);

      const allowedSenderIds = [...teacherIds, ...principalIds, ...adminIds];
      
      if (homeroomTeacherId === userId && userGroupId) {
        const students = await db.select({ id: user.id }).from(user).where(eq(user.groupId, userGroupId));
        const studentIds = students.map(s => s.id);
        allowedSenderIds.push(...studentIds);
      }

      whereConditions = [
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId),
          and(
            inArray(messages.senderId, allowedSenderIds),
            or(
              eq(messages.receiverId, userId),
              isNull(messages.receiverId)
            )
          )
        )
      ];
    } else if (userRole === "student") {
      if (userGroupId) {
        const classmates = await db.select({ id: user.id }).from(user).where(eq(user.groupId, userGroupId));
        const classmateIds = classmates.map(s => s.id);
        
        const allowedIds = [...classmateIds];
        if (homeroomTeacherId) allowedIds.push(homeroomTeacherId);

        whereConditions = [
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId),
            and(
              inArray(messages.senderId, allowedIds),
              or(
                eq(messages.receiverId, userId),
                isNull(messages.receiverId),
                eq(messages.groupId, userGroupId)
              )
            )
          )
        ];
      } else {
        whereConditions = [
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        ];
      }
    } else if (userRole === "parent") {
      if (homeroomTeacherId) {
        whereConditions = [
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId),
            and(
              eq(messages.senderId, homeroomTeacherId),
              or(
                eq(messages.receiverId, userId),
                isNull(messages.receiverId)
              )
            )
          )
        ];
      } else {
        whereConditions = [
          or(
            eq(messages.senderId, userId),
            eq(messages.receiverId, userId)
          )
        ];
      }
    }

    const userMessages = await db.query.messages.findMany({
      where: and(...whereConditions),
      orderBy: [desc(messages.createdAt)],
      with: {
        sender: {
          columns: {
            id: true,
            fullName: true,
            role: true,
          }
        },
        receiver: {
          columns: {
            id: true,
            fullName: true,
            role: true,
          }
        }
      }
    });

    return NextResponse.json(userMessages);
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages", details: error.message },
      { status: 500 }
    );
  }
}

// POST - отправить сообщение с файлом
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user;
    
    // Парсим FormData
    const formData = await request.formData();
    const content = formData.get("content") as string || "";
    const receiverId = formData.get("receiverId") as string | null;
    const groupId = formData.get("groupId") ? parseInt(formData.get("groupId") as string) : null;
    const isBroadcast = formData.get("isBroadcast") === "true";
    const senderName = formData.get("senderName") as string | null;
    const file = formData.get("file") as File | null;

    // Проверка обязательных полей
    if (!content.trim() && !file) {
      return NextResponse.json(
        { error: "Message content or file is required" },
        { status: 400 }
      );
    }

    // Проверка прав на отправку
    const canSend = await checkSendPermission(currentUser, receiverId, groupId, isBroadcast);
    if (!canSend.allowed) {
      return NextResponse.json(
        { error: canSend.reason },
        { status: 403 }
      );
    }

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let fileType: string | null = null;

    // Обработка файла
    if (file) {
      // Проверка размера
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds 10 MB limit" },
          { status: 400 }
        );
      }

      // Создаем директорию для загрузок если не существует
      const uploadDir = path.join(process.cwd(), "public", "uploads", "messages");
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
      }

      // Генерируем уникальное имя файла
      const timestamp = Date.now();
      const originalName = file.name;
      const extension = path.extname(originalName);
      const baseName = path.basename(originalName, extension);
      const safeName = `${baseName}-${timestamp}${extension}`.replace(/[^a-zA-Z0-9.-]/g, "_");
      
      const filePath = path.join(uploadDir, safeName);
      
      // Сохраняем файл
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));
      
      fileUrl = `/uploads/messages/${safeName}`;
      fileName = originalName;
      fileSize = file.size;
      fileType = file.type;
    }

    // Создаем сообщение
    const newMessage = await db.insert(messages).values({
      content: content.trim(),
      senderId: currentUser.id,
      senderName: senderName || null,
      receiverId: receiverId || null,
      groupId: groupId || null,
      isBroadcast: isBroadcast || false,
      fileUrl,
      fileName,
      fileSize,
      fileType,
    }).returning();

    return NextResponse.json(newMessage[0]);
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - отметить сообщение как прочитанное
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: "Message ID required" }, { status: 400 });
    }

    await db.update(messages)
      .set({ readAt: new Date().toISOString() })
      .where(eq(messages.id, messageId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// Функция проверки прав на отправку сообщения
async function checkSendPermission(
  currentUser: any,
  receiverId?: string | null,
  groupId?: number | null,
  isBroadcast?: boolean
): Promise<{ allowed: boolean; reason?: string }> {
  const userRole = currentUser.role;
  const userId = currentUser.id;

  if (userRole === "admin") {
    return { allowed: true };
  }

  if (isBroadcast && userRole !== "principal") {
    return { allowed: false, reason: "Only admin and principal can send broadcasts" };
  }

  if (userRole === "principal") {
    return { allowed: true };
  }

  if (!receiverId && groupId) {
    if (userRole === "teacher") {
      const teacherGroup = await db.query.groups.findFirst({
        where: eq(groups.teacherId, userId),
      });
      if (teacherGroup?.id === groupId) {
        return { allowed: true };
      }
      return { allowed: false, reason: "You can only message your own class" };
    }
    return { allowed: false, reason: "Invalid recipient" };
  }

  if (!receiverId) {
    return { allowed: false, reason: "Recipient is required" };
  }

  const receiver = await db.query.user.findFirst({
    where: eq(user.id, receiverId),
  });

  if (!receiver) {
    return { allowed: false, reason: "Recipient not found" };
  }

  if (userRole === "teacher") {
    // Учитель может писать: другим учителям, директору, админу, ученикам своего класса, родителям своего класса
    if (receiver.role === "teacher" || receiver.role === "principal" || receiver.role === "admin") {
      return { allowed: true };
    }
    
    const teacherGroup = await db.query.groups.findFirst({
      where: eq(groups.teacherId, userId),
    });
    
    if (receiver.role === "student") {
      if (teacherGroup && receiver.groupId === teacherGroup.id) {
        return { allowed: true };
      }
    }
    
    if (receiver.role === "parent") {
      // Проверяем, является ли родитель родителем ученика этого класса
      const { parentsToStudents } = await import("@/db/schema/auth_schema");
      const parentLinks = await db.select().from(parentsToStudents).where(eq(parentsToStudents.parentId, receiverId));
      
      for (const link of parentLinks) {
        const student = await db.query.user.findFirst({
          where: eq(user.id, link.studentId),
          columns: { groupId: true },
        });
        if (student?.groupId === teacherGroup?.id) {
          return { allowed: true };
        }
      }
    }
    
    return { allowed: false, reason: "You can only message teachers, staff, your students, or parents of your class" };
  }

  if (userRole === "student") {
    if (receiver.role === "student" && receiver.groupId === currentUser.groupId) {
      return { allowed: true };
    }
    if (receiver.role === "teacher") {
      const studentGroup = await db.query.groups.findFirst({
        where: eq(groups.id, currentUser.groupId),
      });
      if (studentGroup?.teacherId === receiver.id) {
        return { allowed: true };
      }
    }
    return { allowed: false, reason: "You can only message classmates or your homeroom teacher" };
  }

  if (userRole === "parent") {
    if (receiver.role === "teacher") {
      const { parentsToStudents } = await import("@/db/schema/auth_schema");
      const link = await db.query.parentsToStudents.findFirst({
        where: eq(parentsToStudents.parentId, userId),
      });
      if (link) {
        const studentData = await db.query.user.findFirst({
          where: eq(user.id, link.studentId),
        });
        if (studentData?.groupId) {
          const studentGroup = await db.query.groups.findFirst({
            where: eq(groups.id, studentData.groupId),
          });
          if (studentGroup?.teacherId === receiver.id) {
            return { allowed: true };
          }
        }
      }
    }
    return { allowed: false, reason: "You can only message your child's homeroom teacher" };
  }

  return { allowed: false, reason: "Permission denied" };
}
