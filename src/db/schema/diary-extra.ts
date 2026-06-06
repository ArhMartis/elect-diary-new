import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";
import { user, groups, subjects } from "./auth_schema";

/**
 * ============================================================================
 * ДОПОЛНИТЕЛЬНЫЕ ТАБЛИЦЫ ДЛЯ ДНЕВНИКА УЧАЩЕГОСЯ
 * ============================================================================
 * 
 * Эти таблицы необходимо добавить в базу данных для полноценной работы
 * модуля "Дневник учащегося".
 * 
 * Миграция: drizzle-kit generate && drizzle-kit push
 */

/* =====================================================
   SCHOOL CONTACTS (Контакты школы)
   Хранит контактную информацию об учреждении образования
   ===================================================== */

export const schoolContacts = sqliteTable("school_contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Основная информация
  schoolName: text("school_name").notNull(),
  schoolAddress: text("school_address"),
  schoolPhone: text("school_phone"),
  
  // Должностные лица
  director: text("director"), // Руководитель учреждения
  vicePrincipal: text("vice_principal"), // Заместитель по учебной работе
  vicePrincipalEdu: text("vice_principal_edu"), // Заместитель по воспитательной работе
  homeroomTeacher: text("homeroom_teacher"), // Классный руководитель
  psychologist: text("psychologist"), // Педагог-психолог
  socialPedagogue: text("social_pedagogue"), // Социальный педагог
  
  // Дата последнего обновления
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date()),
});

/* =====================================================
   BELL SCHEDULE (Расписание звонков)
   Хранит расписание уроков по времени
   ===================================================== */

export const bellSchedule = sqliteTable("bell_schedule", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  number: text("number").notNull(), // Номер урока
  start: text("start").notNull(), // Время начала
  end: text("end").notNull(), // Время окончания
  break: text("break"), // Продолжительность перемены
  
  sortOrder: integer("sort_order").default(0), // Порядок сортировки
});

/* =====================================================
   ELECTIVES (Факультативы)
   Список факультативных занятий
   ===================================================== */

export const electives = sqliteTable("electives", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  name: text("name").notNull(), // Название факультатива
  
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "cascade" }), // связь с subjects (спецпредметы)
  
  teacherId: text("teacher_id").references(() => user.id, { onDelete: "set null" }),
  teacherName: text("teacher_name"), // ФИО учителя (кэшируется)
  
  schedule: text("schedule"), // Расписание (напр. "Пн 15:00")
  
  groupId: integer("group_id").references(() => groups.id, { onDelete: "set null" }),
  
  // Дата создания
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/* =====================================================
   ELECTIVE STUDENTS (Ученики на факультативах)
   ===================================================== */

export const electiveStudents = sqliteTable("elective_students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  electiveId: integer("elective_id").notNull().references(() => electives.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/* =====================================================
   HOLIDAYS (Каникулы)
   Даты каникул по учебным годам
   ===================================================== */

export const holidays = sqliteTable("holidays", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  academicYear: text("academic_year").notNull(), // "2025/2026"
  
  // Осенние каникулы
  autumnStart: text("autumn_start"),
  autumnEnd: text("autumn_end"),
  
  // Зимние каникулы
  winterStart: text("winter_start"),
  winterEnd: text("winter_end"),
  
  // Весенние каникулы
  springStart: text("spring_start"),
  springEnd: text("spring_end"),
  
  // Летние каникулы
  summerStart: text("summer_start"),
  summerEnd: text("summer_end"),
});

/* =====================================================
   FINAL GRADES (Итоговые оценки)
   Четвертные, полугодовые, годовые, экзаменационные оценки
   ===================================================== */

export const finalGrades = sqliteTable("final_grades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  
  academicYear: text("academic_year").notNull(), // "2025/2026"
  
  // Четвертные оценки
  q1: text("q1"), // I четверть
  q2: text("q2"), // II четверть
  q3: text("q3"), // III четверть
  q4: text("q4"), // IV четверть

  // Тип оценки: numeric (балл) или passfail (зачёт)
  gradeType: text("grade_type").default("numeric"),
  
  // Итоговые оценки
  year: text("year"), // Годовая
  exam: text("exam"), // Экзаменационная
  final: text("final"), // Итоговая
  
  // Дата последнего обновления
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date()),
}, (table) => ({
  // Уникальная пара studentId + subjectId + academicYear
  uniqueStudentSubjectYear: uniqueIndex("final_grades_unique_idx").on(
    table.studentId,
    table.subjectId,
    table.academicYear
  ),
}));

/* =====================================================
   ATTENDANCE RECORDS (Посещаемость по дням)
   Фиксация посещаемости каждого ученика на конкретную дату и урок
   ===================================================== */

export const attendanceRecords = sqliteTable("attendance_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  date: text("date").notNull(), // YYYY-MM-DD

  type: text("type").notNull(), // "absent" | "unexcused"

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
}, (table) => ({
  uniqueAttendance: uniqueIndex("attendance_records_unique_idx").on(
    table.studentId,
    table.subjectId,
    table.date
  ),
}));

/* =====================================================
   ABSENCES (Пропуски)
   Учёт пропусков учебных занятий по месяцам
   ===================================================== */

export const absences = sqliteTable("absences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  month: text("month").notNull(), // "Сентябрь", "Октябрь" и т.д.
  academicYear: text("academic_year").notNull(), // "2025/2026"
  
  total: integer("total").default(0), // Всего пропусков
  unexcused: integer("unexcused").default(0), // По неуважительным причинам
  
  // Дата записи
  date: integer("date", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
}, (table) => ({
  // Уникальная пара studentId + month + academicYear
  uniqueStudentMonth: uniqueIndex("absences_unique_idx").on(
    table.studentId,
    table.month,
    table.academicYear
  ),
}));

/* =====================================================
   TEACHER COMMENTS (Замечания учителей)
   Замечания и комментарии от учителей
   ===================================================== */

export const teacherComments = sqliteTable("teacher_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  teacherName: text("teacher_name"), // ФИО учителя (кэшируется)
  
  comment: text("comment").notNull(), // Текст замечания
  
  // Дата замечания
  date: integer("date", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/* =====================================================
   TEACHER RECOMMENDATIONS (Рекомендации и благодарности)
   Текстовое поле для рекомендаций, благодарностей и наград
   ===================================================== */

export const teacherRecommendations = sqliteTable("teacher_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  academicYear: text("academic_year").notNull(),
  
  // Текст рекомендаций/благодарностей/наград
  content: text("content").notNull(),
  
  // Автор записи (учитель)
  teacherId: text("teacher_id").references(() => user.id, { onDelete: "set null" }),
  
  // Дата создания
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  
  // Дата последнего обновления
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date()),
});

/* =====================================================
   SCHOOL INFO (Информация о школе)
   Общая информация об учреждении образования
   ===================================================== */

export const schoolInfo = sqliteTable("school_info", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  name: text("name").notNull(), // Полное название
  address: text("address"), // Адрес
  phone: text("phone"), // Телефон
  
  // Дата последнего обновления
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date()),
});

/* =====================================================
   ACADEMIC YEARS (Учебные годы)
   Справочник учебных годов
   ===================================================== */

export const academicYears = sqliteTable("academic_years", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  name: text("name").notNull(), // "2025/2026"
  
  startDate: text("start_date"), // Дата начала (1 сентября)
  endDate: text("end_date"), // Дата окончания (31 августа)
  
  isActive: integer("is_active", { mode: "boolean" }).default(false), // Текущий учебный год
});

export const electivesRelations = relations(electives, ({ one, many }) => ({
  group: one(groups, {
    fields: [electives.groupId],
    references: [groups.id],
  }),
  subject: one(subjects, {
    fields: [electives.subjectId],
    references: [subjects.id],
  }),
  students: many(electiveStudents),
}));

export const electiveStudentsRelations = relations(electiveStudents, ({ one }) => ({
  elective: one(electives, {
    fields: [electiveStudents.electiveId],
    references: [electives.id],
  }),
  student: one(user, {
    fields: [electiveStudents.studentId],
    references: [user.id],
  }),
}));
