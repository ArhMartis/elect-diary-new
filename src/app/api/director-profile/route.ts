import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { directorProfile } from "@/db/schema/diary-extra";
import { schoolContacts } from "@/db/schema/diary-extra";
import { user } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  try {
    let profile = await db.query.directorProfile.findFirst();

    // Авто-заполняем ФИО из первого директора в системе
    const principalUser = await db.query.user.findFirst({ where: eq(user.role, "principal"), columns: { fullName: true } });

    if (!profile) {
      const [created] = await db.insert(directorProfile).values({
        fullName: principalUser?.fullName || "",
      }).returning();
      profile = created;
    } else if (!profile.fullName && principalUser?.fullName) {
      await db.update(directorProfile).set({ fullName: principalUser.fullName }).where(eq(directorProfile.id, profile.id));
      profile.fullName = principalUser.fullName;
    }

    // Телефон всегда из school_contacts (единая точка)
    const contacts = await db.query.schoolContacts.findFirst();
    return NextResponse.json({ ...profile, phone: contacts?.directorPhone || "" });
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

    const updateData: Record<string, any> = {
      fullName: body.fullName,
      monHours: body.monHours,
      tueHours: body.tueHours,
      wedHours: body.wedHours,
      thuHours: body.thuHours,
      friHours: body.friHours,
      satHours: body.satHours,
      sunHours: body.sunHours,
      receptionHours: body.receptionHours,
    };

    if (profile) {
      await db.update(directorProfile).set(updateData).where(eq(directorProfile.id, profile.id));
    } else {
      await db.insert(directorProfile).values(updateData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating director profile:", error);
    return NextResponse.json({ error: "Ошибка сохранения" }, { status: 500 });
  }
}
