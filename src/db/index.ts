import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as postsSchema from "./schema/posts";
import * as usersSchema from "./schema/auth_schema";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite, { 
  schema: { ...postsSchema, ...usersSchema } 
});