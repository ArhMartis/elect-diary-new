import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { user } from "./auth_schema";

/* =====================================================
   DIARY NOTES (Заметки ученика в дневнике)
   ===================================================== */

export const diaryNotes = sqliteTable("diary_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Ученик, которому принадлежит заметка
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // ID недели (начало недели в формате YYYY-MM-DD)
  weekStart: text("week_start").notNull(),

  // Текст заметки
  note: text("note"),

  // Дата создания
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),

  // Дата обновления
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [
  index("diary_notes_studentId_idx").on(table.studentId),
  index("diary_notes_weekStart_idx").on(table.weekStart),
]);

/* =====================================================
   DIARY VERIFICATION (Подтверждения от классного руководителя)
   ===================================================== */

export const diaryVerification = sqliteTable("diary_verification", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Ученик
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // ID недели (начало недели в формате YYYY-MM-DD)
  weekStart: text("week_start").notNull(),

  // Классный руководитель, который подтвердил
  teacherId: text("teacher_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Дата подтверждения
  verifiedAt: integer("verified_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
}, (table) => [
  index("diary_verification_studentId_idx").on(table.studentId),
  index("diary_verification_weekStart_idx").on(table.weekStart),
  // Уникальная пара studentId + weekStart (один учитель на неделю)
  index("diary_verification_unique_idx").on(table.studentId, table.weekStart),
]);

/* =====================================================
   PARENT VERIFICATION (Подтверждения от родителей)
   ===================================================== */

export const parentVerification = sqliteTable("parent_verification", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Ученик
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // ID недели (начало недели в формате YYYY-MM-DD)
  weekStart: text("week_start").notNull(),

  // Родитель, который подтвердил просмотр
  parentId: text("parent_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Дата подтверждения
  verifiedAt: integer("verified_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
}, (table) => [
  index("parent_verification_studentId_idx").on(table.studentId),
  index("parent_verification_weekStart_idx").on(table.weekStart),
  // Уникальная пара studentId + weekStart (один родитель на неделю)
  index("parent_verification_unique_idx").on(table.studentId, table.weekStart),
]);
