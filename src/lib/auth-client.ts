import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins"
import { twoFactorClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
baseURL: process.env.BETTER_AUTH_URL,
plugins: [ adminClient(), twoFactorClient() ],
additionalFields: {
  signUp: {
    fullName: {
      type: "string",
      required: true,
    },
    avatar: {
      type: "string",
      required: false,
    },
  },
},
});
