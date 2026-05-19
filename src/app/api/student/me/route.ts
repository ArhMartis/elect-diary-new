import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// GET - получить информацию о текущем ученике
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = session.user;
    
    // Получаем актуальные данные пользователя из БД
    const userData = await db.query.user.findFirst({
      where: eq(user.id, currentUser.id),
      columns: {
        id: true,
        fullName: true,
        name: true,
        email: true,
        role: true,
        groupId: true,
        emailVerified: true,
        avatar: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error("Error fetching student data:", error);
    return NextResponse.json(
      { error: "Failed to fetch student data", details: error.message },
      { status: 500 }
    );
  }
}
