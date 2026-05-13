import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const requestLog = sqliteTable(
  "request_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id"),
    method: text("method").notNull(),
    path: text("path").notNull(),
    statusCode: integer("status_code"),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("request_log_user_id_idx").on(table.userId),
    index("request_log_created_at_idx").on(table.createdAt),
  ]
);

import { sql } from "drizzle-orm";