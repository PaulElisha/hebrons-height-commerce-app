/** @format */
import Env from "@/env.ts";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import db from "@db/db.ts";
import * as schema from "@schema/auth.ts";
import { hashPassword, verifyPassword } from "@shared/util/password.ts";
import { betterAuth } from "better-auth";
import { jwt, openAPI } from "better-auth/plugins";

const allowedOrigins = Env.CORS_ORIGIN.includes(",")
 ? Env.CORS_ORIGIN.split(",")
 : [Env.CORS_ORIGIN];

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
 trustedHeaders: ["x-forwarded-proto", "x-forwarded-host"],
 trustedOrigins: allowedOrigins,
 emailAndPassword: {
  enabled: true,
  minPasswordLength: 6,
  autoSignIn: true,
  password: {
   hash: hashPassword,
   verify: verifyPassword,
  },
 },
 advanced: {
  useSecureCookies: Env.BASE_URL.startsWith("https://"),
  cookiePrefix: "hhg",
  cookies: {
   session_token: {
    name: "auth_session_token",
   },
  },
 },
 plugins: [openAPI(), jwt()],
});
