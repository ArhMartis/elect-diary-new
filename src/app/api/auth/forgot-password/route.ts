import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, resetTokens } from "@/db/schema/auth_schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });
    if (!existingUser) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(resetTokens).values({
      email,
      token,
      expiresAt,
    });

    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"KnowledgeBY" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Сброс пароля — KnowledgeBY",
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#4f46e5">Сброс пароля</h2>
            <p>Здравствуйте!</p>
            <p>Для сброса пароля перейдите по ссылке:</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">
              Сбросить пароль
            </a>
            <p style="color:#666;font-size:14px">Ссылка действительна 1 час.</p>
            <p style="color:#666;font-size:14px">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("Failed to send reset email:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
