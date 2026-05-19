import { betterAuth } from "better-auth";
import { admin, twoFactor } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index";
import * as authschema from "../db/schema/auth_schema";
import * as posts from "../db/schema/posts";
import { user } from "@/db/schema/auth_schema";
import nodemailer from "nodemailer";

const schema = { ...authschema, ...posts };

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),

  emailAndPassword: { 
    enabled: true,
    minPasswordLength: 6,
  },

  errors: {
    // Перевод сообщений об ошибках
    PASSWORD_TOO_SHORT: "Пароль слишком короткий. Минимум 6 символов.",
    PASSWORD_TOO_LONG: "Пароль слишком длинный. Максимум 128 символов.",
    EMAIL_INVALID: "Некорректный email адрес.",
    EMAIL_REQUIRED: "Email обязателен.",
    PASSWORD_REQUIRED: "Пароль обязателен.",
    USER_ALREADY_EXISTS: "Пользователь с таким email уже существует.",
    USER_NOT_FOUND: "Пользователь не найден.",
    INVALID_PASSWORD: "Неверный пароль.",
    EMAIL_NOT_VERIFIED: "Email не подтвержден.",
    INVALID_TOKEN: "Недействительный токен.",
    TOKEN_EXPIRED: "Срок действия токена истек.",
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user: u, url }) => {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"KnowledgeBY" <${process.env.SMTP_USER}>`,
          to: u.email,
          subject: "Подтверждение email — KnowledgeBY",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#4f46e5">Подтверждение email</h2>
              <p>Здравствуйте, ${u.name || u.email}!</p>
              <p>Для подтверждения email перейдите по ссылке:</p>
              <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">
                Подтвердить email
              </a>
              <p style="color:#666;font-size:14px">Или скопируйте ссылку: ${url}</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Email send failed:", e);
      }
    },
  },

  advanced: {
    disableCSRFCheck: true,
    disableOriginCheck: true,
  },

  user: {
    additionalFields: {
      avatar: {
        type: "string",
        required: false,
      },
      fullName: {
        type: "string",
        required: true,
      },
    },
  },

  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "student",
    }),
    twoFactor(),
  ],
});
