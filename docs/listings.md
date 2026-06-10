## Листинг 3.1 — Серверное действие (Server Action) для добавления оценки
**Файл:** `src/app/teacher/actions.ts`

```typescript
"use server"; // Директива Next.js — функция выполняется на сервере, вызывается из клиента

import { db } from "@/db";
import { grades } from "@/db/schema/auth_schema";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addGrade(formData: FormData) {
  // requireRole проверяет сессию и роль, при несоответствии делает redirect(307)
  const teacher = await requireRole(["teacher", "principal", "admin"]);

  // Извлекаем поля из FormData, переданного из клиентского компонента
  const studentId = formData.get("studentId") as string;
  const subjectId = Number(formData.get("subjectId"));
  const value = formData.get("value") as string;
  const comment = formData.get("comment") as string;
  const date = formData.get("date") as string;

  // Drizzle ORM — вставка с типобезопасными полями
  await db.insert(grades).values({
    studentId,
    subjectId,
    teacherId: teacher.id,     // ID учителя из сессии (не из формы!)
    value,
    comment: comment || null,   // Комментарий опционален
    date: date || null,
  });

  // Перезагружаем кэш страницы учителя, чтобы новая оценка отобразилась
  revalidatePath("/teacher");
}
```

---

## Листинг 3.2 — API-роут для получения расписания
**Файл:** `src/app/api/schedule/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { schedule, subjects, user } from "@/db/schema/auth_schema";
import { eq, and, asc, gte, lte, or, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Читаем query-параметры из URL, например: /api/schedule?groupId=5&quarter=2
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get("groupId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const subjectId = searchParams.get("subjectId");
    const teacherId = searchParams.get("teacherId");
    const quarter = searchParams.get("quarter");

    // groupId обязателен — без него расписание не имеет смысла
    if (!groupId) {
      return NextResponse.json({ error: "Не указан groupId" }, { status: 400 });
    }

    // Динамически собираем условия WHERE
    const conditions: any[] = [eq(schedule.groupId, parseInt(groupId))];

    if (teacherId) conditions.push(eq(schedule.teacherId, teacherId));
    if (subjectId) conditions.push(eq(schedule.subjectId, parseInt(subjectId)));

    // Фильтр по четверти: записи для указанной четверти ИЛИ общие (quarter = NULL)
    if (quarter) {
      conditions.push(
        or(eq(schedule.quarter, parseInt(quarter)), isNull(schedule.quarter))
      );
    }

    // Фильтр по диапазону дат
    if (startDate && endDate) {
      conditions.push(
        or(
          and(gte(schedule.lessonDate, startDate), lte(schedule.lessonDate, endDate)),
          isNull(schedule.lessonDate)
        )
      );
    }

    // JOIN-запрос: расписание + название предмета + ФИО учителя
    const scheduleList = await db
      .select({
        id: schedule.id,
        groupId: schedule.groupId,
        subjectId: schedule.subjectId,
        subjectName: subjects.name,
        teacherId: schedule.teacherId,
        teacherName: user.fullName,
        lessonDate: schedule.lessonDate,
        dayOfWeek: schedule.dayOfWeek,
        lessonNumber: schedule.lessonNumber,
        quarter: schedule.quarter,
      })
      .from(schedule)
      .leftJoin(subjects, eq(schedule.subjectId, subjects.id))
      .leftJoin(user, eq(schedule.teacherId, user.id))
      .where(and(...conditions))
      .orderBy(asc(schedule.quarter), asc(schedule.dayOfWeek), asc(schedule.lessonNumber));

    return NextResponse.json(scheduleList);
  } catch (error) {
    console.error("Ошибка при получении расписания:", error);
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
```

---

## Листинг 3.3 — Drizzle-схема таблицы user
**Файл:** `src/db/schema/auth_schema.ts`

```typescript
import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Таблица пользователей — центральная таблица системы
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),                                    // UUID — первичный ключ
  name: text("name").notNull(),                                   // Логин (display name)
  fullName: text("full_name").notNull(),                          // ФИО (обязательное поле)
  email: text("email").notNull().unique(),                        // Email — уникальный логин
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false).notNull(),                                    // Подтверждён ли email
  image: text("image"),                                           // Аватар (ссылка)
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),                                                   // Автоматическая дата создания
  role: text("role").$type<Role>().default("student"),            // Роль: admin/principal/teacher/student/parent
  banned: integer("banned", { mode: "boolean" }).default(false),  // Флаг блокировки
  groupId: integer("group_id"),                                   // Класс (для учеников)
});
```

---

## Листинг 3.4 — RBAC-функция проверки прав доступа
**Файл:** `src/lib/rbac.ts`

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Проверяет, что пользователь авторизован и имеет одну из разрешённых ролей.
 * При несоответствии выполняет HTTP-редирект 307.
 * 
 * @param allowedRoles - массив допустимых ролей, например ["admin", "teacher"]
 * @returns объект пользователя из сессии при успешной проверке
 */
export async function requireRole(allowedRoles: string[]) {
  // 1. Проверяем наличие сессии
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Если сессии нет — просим войти
  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const role = session.user.role;

  // Если роль не определена — тоже просим войти
  if (!role) {
    redirect("/sign-in");
  }

  // 2. Проверяем, входит ли роль в список разрешённых
  if (!allowedRoles.includes(role)) {
    redirect("/");           // Редирект на главную при недостатке прав
  }

  // 3. Всё хорошо — возвращаем пользователя для дальнейшего использования
  return session.user;
}
```
