import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await auth.api.sendVerificationEmail({
      headers: await headers(),
      body: {
        email: session.user.email,
        callbackURL: "/",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending verification:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
