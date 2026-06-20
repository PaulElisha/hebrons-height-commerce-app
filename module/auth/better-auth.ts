/** @format */

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { hash, type Options, verify } from "@node-rs/argon2";
import { betterAuth } from "better-auth";
import { secret } from "encore.dev/config";

import { Mailer, Mail } from "../../shared/send-email.ts";
import * as schema from "../../schema/auth.ts";
import { db } from "./db.ts";
import { TUser } from "./routes.ts";
import { template } from "../../shared/create-template.ts";
import { Env } from "../../env.ts";

const authSecret = secret("AuthSecret");

export default betterAuth({
 secret: authSecret(),
 basePath: "/auth",
 baseURL: Env.BASE_URL,
 database: drizzleAdapter(db, {
  provider: "pg",
  schema: schema,
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
 trustedOrigins: [Env.CORS_ORIGIN, "http://127.0.0.1:4000"],
 emailAndPassword: {
  enabled: true,
  minPasswordLength: 8,
  maxPasswordLength: 128,
  sendOnSignUp: true,
  autoSignIn: true,
  password: {
   hash: hashPassword,
   verify: verifyPassword,
  },
  // requireEmailVerification: true,
  sendVerificationEmail: async ({ user, url, token }: any, request: any) => {
   console.log("Url:", url);
   Mailer.relayTo<TUser>(Mail.dispatcher)({
    user: user,
    subject: "Verify your email address",
    message: await template`verify-signup.html${{
     user: user,
     verificationUrl: url,
    }}`,
   });
   // void sendEmail({
   //  to: user.email,
   //  subject: "Verify your email address",
   //  text: `Click the link to verify your email: ${url}`,
   // });
  },
  sendResetPassword: async ({ user, url, token }, request) => {
   // void sendEmail({
   //  to: user.email,
   //  subject: "Reset your password",
   //  text: `Click the link to reset your password: ${url}`,
   // });
  },
  revokeSessionsOnPasswordReset: true,
  onPasswordReset: async ({ user }, request) => {
   // your logic here
   console.log(`Password for user ${user.email} has been reset.`);
  },
 },
});

const opts: Options = {
 memoryCost: 65536, // 64 MiB
 timeCost: 3, // 3 iterations
 parallelism: 4, // 4 lanes
 outputLen: 32, // 32 bytes
 algorithm: 2, // Argon2id
};

export async function hashPassword(password: string) {
 const result = await hash(password, opts);
 return result;
}
export async function verifyPassword(data: { password: string; hash: string }) {
 const { password, hash } = data;
 const result = await verify(hash, password, opts);
 return result;
}
