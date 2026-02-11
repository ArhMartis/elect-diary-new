import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index";
import * as authschema from "../db/schema/auth_schema";
import * as posts from "../db/schema/posts";

const schema = {...authschema,...posts};

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
            schema,
    }),
    emailAndPassword: { enabled: true }, // Включает Email Auth
plugins: [
        admin({
      adminRoles: ["admin"],
      defaultRole: "user",
    }),
  ],
});