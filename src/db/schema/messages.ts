import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from 'drizzle-orm';
import { user } from "./auth_schema";

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  senderName: text("sender_name"), // Custom name for admin broadcasts
  receiverId: text("receiver_id")
    .references(() => user.id, { onDelete: "cascade" }),
  groupId: integer("group_id"), // For class-wide messages
  isBroadcast: integer("is_broadcast", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP").notNull(),
  readAt: text("read_at"),
});

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(user, {
    fields: [messages.senderId],
    references: [user.id],
  }),
  receiver: one(user, {
    fields: [messages.receiverId],
    references: [user.id],
  }),
}));
