import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as postsSchema from "./schema/posts";
import * as usersSchema from "./schema/auth_schema";
import * as diarySchema from "./schema/diary";
import * as schoolSchema from "./schema/school";
import * as diaryExtraSchema from "./schema/diary-extra";
import * as messagesSchema from "./schema/messages";
import * as requestLogSchema from "./schema/request_log";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite, {
  schema: {
    ...postsSchema,
    ...usersSchema,
    ...diarySchema,
    ...schoolSchema,
    ...diaryExtraSchema,
    ...messagesSchema,
    ...requestLogSchema,
  }
});