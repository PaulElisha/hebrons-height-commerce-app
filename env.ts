/** @format */

import { env as loadEnv } from "custom-env";
import z from "zod";

process.env.APP_STAGE = process.env.APP_STAGE || "dev";

const isProduction = process.env.APP_STAGE === "prod";
const isDevelopment = process.env.APP_STAGE === "dev";
const isTesting = process.env.APP_STAGE === "test";

if (isProduction) {
 loadEnv("prod");
} else if (isTesting) {
 loadEnv("test");
} else {
 if (isDevelopment) loadEnv("dev");
}

const EnvSchema = z.object({
 PORT: z.coerce.number(),

 NODE_ENV: z
  .enum(["production", "development", "testing"])
  .default("production"),
 APP_STAGE: z.enum(["dev", "test", "prod"]).default("dev"),

 DB_URL: z.string(),

 BASE_URL: z.string(),

 AUTH_SECRET: z.string(),

 SALT: z.coerce.number().min(10),

 CORS_ORIGIN: z.string(),
 VERSION: z.string(),

 CLOUDINARY_CLOUD_NAME: z.string(),
 CLOUDINARY_KEY: z.string(),
 CLOUDINARY_SECRET: z.string(),

 EMAIL_HOST: z.string(),
 EMAIL_PORT: z.coerce.number(),

 EMAIL_USER: z.email("Invalid email"),
 EMAIL_PASS: z.string(),

 PAYSTACK_INIT_URL: z.string(),
 PAYSTACK_VERIFY_URL: z.string(),
 PAYSTACK_SECRET_KEY: z.string(),

 STRIPE_SECRET_KEY: z.string(),
 STRIPE_WEBHOOK_SECRET: z.string(),

 SCALER: z.coerce.number().default(100),
});

export type EnvType = z.infer<typeof EnvSchema>;
let Env: EnvType;

try {
 Env = EnvSchema.parse(process.env);
} catch (e) {
 if (e instanceof z.ZodError) {
  console.error("Invalid environment variables:", e.issues);
  console.log(JSON.stringify(z.treeifyError(e), null, 2));

  e.issues.forEach((err) => {
   const path = err.path.join(".");
   console.log(`${path}-${err.message}`);
  });

  process.exit(1);
 }

 throw e;
}

export const isProd = () => Env.APP_STAGE === "prod";
export const isDev = () => Env.APP_STAGE === "dev";
export const isTest = () => Env.APP_STAGE === "test";

export default Env;
