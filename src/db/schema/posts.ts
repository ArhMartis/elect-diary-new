import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql, relations } from 'drizzle-orm';
import { user } from "./auth_schema"; // Импорт таблицы пользователей

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // В SQLite даты обычно хранятся как строки (ISO) или числа
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`).notNull(),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(user, {
    fields: [posts.authorId],
    references: [user.id],
  }),
}));