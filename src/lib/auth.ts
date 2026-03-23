import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index";
import * as authschema from "../db/schema/auth_schema";
import * as posts from "../db/schema/posts";
import { user } from "@/db/schema/auth_schema";

const schema = { ...authschema, ...posts };

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),

  emailAndPassword: { enabled: true },

  user: {
    additionalFields: {
      avatar: {
        type: "string",
        required: false, // обязательно false!
      },
      fullName: {
        type: "string",
        required: true,
      },
    },
  },

  plugins: [
    admin({
      adminRoles: ["admin"],
      defaultRole: "student",
    }),
  ],
});
