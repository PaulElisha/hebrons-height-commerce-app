/** @format */

import Env from "@/env.ts";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import db from "@db/db.ts";
import * as schema from "@schema/auth.ts";
import { hashPassword, verifyPassword } from "@shared/util/password.ts";
import { betterAuth } from "better-auth";
import { jwt, openAPI } from "better-auth/plugins";

export const auth = betterAuth({
 secret: Env.AUTH_SECRET,
 basePath: "/api/auth",
 baseURL: Env.BASE_URL,
 database: drizzleAdapter(db, {
  provider: "pg",
  schema,
 }),
 user: {
  additionalFields: {
   role: {
    type: "string",
    required: true,
    input: true,
   },
  },
 },
 trustedOrigins: [Env.CORS_ORIGIN],
 emailAndPassword: {
  enabled: true,
  minPasswordLength: 6,
  // sendOnSignUp: true,
  autoSignIn: true,
  password: {
   hash: hashPassword,
   verify: verifyPassword,
  },
 },
 advanced: {
  cookies: {
   session_token: {
    name: "auth_session_token",
   },
  },
 },
 plugins: [openAPI()],
});
