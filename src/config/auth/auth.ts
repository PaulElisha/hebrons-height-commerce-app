/** @format */

import Env from "@/env.ts";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import db from "@db/db.ts";
import * as schema from "@schema/auth.ts";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
 secret: Env.AUTH_SECRET,
 experimental: { joins: true },
 basePath: "/auth",
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
 trustedOrigins: [
  Env.CORS_ORIGIN,
  "http://127.0.0.1:4000",
  "https://*.lovable.app",
  "https://hhg-commerce-app.onrender.com",
 ],
});
