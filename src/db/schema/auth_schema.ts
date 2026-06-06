import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";



/* ===== ROLES ===== */

export const roles = [
  "admin",
  "principal",
  "teacher",
  "student",
  "parent",
] as const;

export type Role = typeof roles[number];

/* =========================================================
   USERS
   Основная таблица пользователей (better-auth core + admin)
   ========================================================= */

export const user = sqliteTable("user", {
  // Primary key пользователя
  id: text("id").primaryKey(),

  // Имя пользователя (можно использовать как display name)
  name: text("name").notNull(),

  // ФИО пользователя (обязательное поле)
  fullName: text("full_name").notNull(),

  // Email (уникальный логин)
  email: text("email").notNull().unique(),

  // Подтверждён ли email
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),

  // Аватар пользователя
  image: text("image"),

  // Дата создания аккаунта
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),

  // Дата последнего обновления
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),

  // Последняя активность (online)
  lastSeen: integer("last_seen", { mode: "timestamp_ms" }),

    avatar: text("avatar"),

  /* ===== поля admin plugin ===== */

  // Роль пользователя (admin / teacher / student / parent)
 role: text("role")
  .$type<Role>()
  .default("student"),

  // Забанен ли пользователь
  banned: integer("banned", { mode: "boolean" }).default(false),

  // Причина бана
  banReason: text("ban_reason"),

  // Дата окончания бана
  banExpires: integer("ban_expires", { mode: "timestamp_ms" }),

  // Класс/группа ученика
  groupId: integer("group_id"),

  // Двухфакторная аутентификация включена
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).default(false),
});

/* =========================================================
   SESSIONS
   Сессии авторизации (cookies / tokens)
   ========================================================= */

export const session = sqliteTable(
  "session",
  {
    // ID сессии
    id: text("id").primaryKey(),

    // Когда сессия истекает
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),

    // Уникальный токен сессии
    token: text("token").notNull().unique(),

    // Дата создания сессии
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    // Последнее обновление сессии
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),

    // IP адрес пользователя
    ipAddress: text("ip_address"),

    // User-Agent браузера
    userAgent: text("user_agent"),

    // Владелец сессии
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Если сессия создана через impersonation (admin → user)
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [
    // Индекс для быстрого поиска сессий пользователя
    index("session_userId_idx").on(table.userId),
  ],
);

/* =========================================================
   ACCOUNTS
   Провайдеры входа (email/password, OAuth и т.п.)
   ========================================================= */

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),

    // ID аккаунта у провайдера
    accountId: text("account_id").notNull(),

    // ID провайдера (credentials, google, github...)
    providerId: text("provider_id").notNull(),

    // Пользователь, к которому привязан аккаунт
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // OAuth / credentials данные
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),

    // Сроки действия токенов
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),

    // OAuth scope
    scope: text("scope"),

    // Хэш пароля (для credentials)
    password: text("password"),

    // Даты
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Индекс для поиска аккаунтов пользователя
    index("account_userId_idx").on(table.userId),
  ],
);

/* =========================================================
   VERIFICATION
   Email verification, reset password, magic links
   ========================================================= */

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),

    // Email / identifier
    identifier: text("identifier").notNull(),

    // Код или токен подтверждения
    value: text("value").notNull(),

    // Когда истекает
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").on(table.identifier),
  ],
);

/* =========================================================
   GROUPS (Классы)
   ========================================================= */

export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Название класса (9-А, 10-Б)
  name: text("name").notNull(),

  // Классный руководитель
  teacherId: text("teacher_id").references(() => user.id, {
    onDelete: "set null",
  }),
});

/* =========================================================
   SUBJECTS (Предметы)
   ========================================================= */

export const subjects = sqliteTable("subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").default("regular"),
  teacherId: text("teacher_id").references(() => user.id, { onDelete: "set null" }),
});

/* =========================================================
   TEACHER SUBJECTS (Справочник: учителя ↔ предметы)
   Связь многие-ко-многим: один учитель может вести несколько предметов,
   один предмет может вестись несколькими учителями
   ========================================================= */

export const teacherSubjects = sqliteTable("teacher_subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  // Дата закрепления
  assignedAt: integer("assigned_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/* =========================================================
   TEACHER CLASSES (Справочник: учителя ↔ классы)
   Связь многие-ко-многим: один учитель может преподавать в нескольких классах
   ========================================================= */

export const teacherClasses = sqliteTable("teacher_classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
}, (table) => [
  index("teacher_classes_unique_idx").on(table.teacherId, table.groupId),
]);

/* =========================================================
   SCHEDULE (Расписание)
   ========================================================= */

export const schedule = sqliteTable("schedule", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),

  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  teacherId: text("teacher_id")
    .references(() => user.id, { onDelete: "cascade" }),

  // Название мероприятия/собрания/классного часа
  name: text("name"),

  // Дата урока (конкретная дата, например "2025-03-10")
  lessonDate: text("lesson_date"), // формат YYYY-MM-DD

  // День недели (1-6) для регулярного расписания
  dayOfWeek: integer("day_of_week"), // 1–6

  lessonNumber: integer("lesson_number").notNull(),

  // Четверть (1-4) для разделения расписания по четвертям
  quarter: integer("quarter"), // 1–4, null = для всех четвертей
});

/* =========================================================
   GRADES (Оценки)
   ========================================================= */

export const grades = sqliteTable("grades", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  value: text("value").notNull(), // 5, 4, 3, Н

  comment: text("comment"),

  date: text("date").default(sql`CURRENT_DATE`),

  // Четверть (1-4)
  academicPeriodId: integer("academic_period_id")
    .references(() => academicPeriods.id, { onDelete: "set null" }),

  // Дата создания оценки
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
});



/* =========================================================
   PARENTS_TO_STUDENTS
   ========================================================= */

export const parentsToStudents = sqliteTable("parents_to_students", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  parentId: text("parent_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

/* =========================================================
   ACADEMIC PERIODS (Четверти)
   ========================================================= */

export const academicPeriods = sqliteTable("academic_periods", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull(), // 1 четверть

  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),

  // Класс, к которому относится четверть (null = для всех классов)
  groupId: integer("group_id").references(() => groups.id, { onDelete: "cascade" }),
});

/* =========================================================
   HOMEWORK (Домашнее задание)
   ========================================================= */

export const homework = sqliteTable("homework", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Учитель, который задал ДЗ
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Класс, которому задано ДЗ
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),

  // Предмет
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  // Дата урока
  lessonDate: text("lesson_date").notNull(), // формат YYYY-MM-DD

  // Текст домашнего задания
  description: text("description").notNull(),

  // Дата, к которой нужно выполнить (срок)
  dueDate: text("due_date"), // формат YYYY-MM-DD

  // Дата создания
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/* =========================================================
   RELATIONS
   Связи между таблицами
   ========================================================= */

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),

  // Оценки как ученик
  gradesReceived: many(grades, {
    relationName: "student_grades",
  }),

  // Оценки как учитель
  gradesGiven: many(grades, {
    relationName: "teacher_grades",
  }),

  // Родитель → дети
  parentLinks: many(parentsToStudents, {
    relationName: "parent_links",
  }),

  // Ученик → родители
  studentLinks: many(parentsToStudents, {
    relationName: "student_links",
  }),

  // Класс ученика
  group: one(groups, {
    fields: [user.groupId],
    references: [groups.id],
  }),

  // Классы где преподаёт
  teacherClassAssignments: many(teacherClasses),
}));


export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  student: one(user, {
    fields: [grades.studentId],
    references: [user.id],
    relationName: "student_grades",
  }),

  teacher: one(user, {
    fields: [grades.teacherId],
    references: [user.id],
    relationName: "teacher_grades",
  }),

  subject: one(subjects, {
    fields: [grades.subjectId],
    references: [subjects.id],
  }),

  academicPeriod: one(academicPeriods, {
    fields: [grades.academicPeriodId],
    references: [academicPeriods.id],
  }),
}));

export const parentsToStudentsRelations = relations(
  parentsToStudents,
  ({ one }) => ({
    parent: one(user, {
      fields: [parentsToStudents.parentId],
      references: [user.id],
      relationName: "parent_links",
    }),

    student: one(user, {
      fields: [parentsToStudents.studentId],
      references: [user.id],
      relationName: "student_links",
    }),
  })
);

export const groupsRelations = relations(groups, ({ one, many }) => ({
  teacher: one(user, {
    fields: [groups.teacherId],
    references: [user.id],
  }),

  schedule: many(schedule),

  // Ученики класса
  students: many(user),

  // Четверти класса
  academicPeriods: many(academicPeriods),

  // Учителя преподающие в классе
  teacherClassAssignments: many(teacherClasses),
}));

export const academicPeriodsRelations = relations(academicPeriods, ({ one }) => ({
  group: one(groups, {
    fields: [academicPeriods.groupId],
    references: [groups.id],
  }),
}));

export const homeworkRelations = relations(homework, ({ one }) => ({
  teacher: one(user, {
    fields: [homework.teacherId],
    references: [user.id],
  }),

  group: one(groups, {
    fields: [homework.groupId],
    references: [groups.id],
  }),

  subject: one(subjects, {
    fields: [homework.subjectId],
    references: [subjects.id],
  }),
}));

export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
  teacher: one(user, {
    fields: [teacherSubjects.teacherId],
    references: [user.id],
  }),

  subject: one(subjects, {
    fields: [teacherSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const teacherClassesRelations = relations(teacherClasses, ({ one }) => ({
  teacher: one(user, {
    fields: [teacherClasses.teacherId],
    references: [user.id],
  }),

  group: one(groups, {
    fields: [teacherClasses.groupId],
    references: [groups.id],
  }),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  teacherAssignments: many(teacherSubjects),
  groupAssignments: many(groupSubjects),
}));

export const groupSubjects = sqliteTable("group_subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
}, (table) => [
  index("group_subjects_unique_idx").on(table.groupId, table.subjectId),
]);

export const groupSubjectsRelations = relations(groupSubjects, ({ one }) => ({
  group: one(groups, {
    fields: [groupSubjects.groupId],
    references: [groups.id],
  }),
  subject: one(subjects, {
    fields: [groupSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const quarterConfirmations = sqliteTable("quarter_confirmations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id").notNull().references(() => groups.id),
  quarter: integer("quarter").notNull(),
  academicYear: text("academic_year").notNull(),
  confirmedByTeacher: text("confirmed_by_teacher"),
  confirmedByTeacherAt: integer("confirmed_by_teacher_at", { mode: "timestamp" }),
  confirmedByParent: text("confirmed_by_parent"),
  confirmedByParentAt: integer("confirmed_by_parent_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
}, (table) => ({
  uniqueGroupQuarter: index("quarter_confirmations_unique").on(table.groupId, table.quarter, table.academicYear),
}));

export const resetTokens = sqliteTable("reset_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  used: integer("used", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});


