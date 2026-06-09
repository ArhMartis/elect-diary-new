import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { directorProfile } from "@/db/schema/diary-extra";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  try {
    let profile = await db.query.directorProfile.findFirst();
    if (!profile) {
      const [created] = await db.insert(directorProfile).values({}).returning();
      profile = created;
    }
    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching director profile:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Только администратор может редактировать" }, { status: 403 });
    }

    const body = await request.json();
    let profile = await db.query.directorProfile.findFirst();

    if (profile) {
      await db.update(directorProfile)
        .set({
          fullName: body.fullName,
          phone: body.phone,
          workdaysHours: body.workdaysHours,
          weekendHours: body.weekendHours,
          receptionHours: body.receptionHours,
        })
        .where(eq(directorProfile.id, profile.id));
    } else {
      await db.insert(directorProfile).values(body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating director profile:", error);
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 });
  }
}
