import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "./auth_schema";

export const classes = sqliteTable("classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // "7А"
  homeroomTeacherId: text("homeroom_teacher_id")
    .references(() => user.id), // классный руководитель
});
