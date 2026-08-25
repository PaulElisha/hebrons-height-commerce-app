/** @format */
/**
 * Seeds an administrator account into the database.
 *
 * Credentials can be overridden via environment variables:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 *
 * Usage:
 *   npm run seed:admin
 */
import db from "@db/db.ts";
import { account, user } from "@db/schema/auth.ts";
import { hashPassword } from "@shared/util/password.ts";
import { and, eq } from "drizzle-orm";

const ADMIN_NAME = process.env.ADMIN_NAME || "Hebrons Height Admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@hhg.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";

export async function seedAdmin(): Promise<{ id: string; email: string }> {
 if (ADMIN_PASSWORD.length < 6) {
  throw new Error("ADMIN_PASSWORD must be at least 6 characters");
 }

 const now = new Date();
 const passwordHash = await hashPassword(ADMIN_PASSWORD);

 const [existingUser] = await db
  .select()
  .from(user)
  .where(eq(user.email, ADMIN_EMAIL))
  .limit(1);

 let userId: string;

 if (existingUser) {
  userId = existingUser.id;

  await db
   .update(user)
   .set({ role: "admin", updatedAt: now })
   .where(eq(user.id, userId));

  console.log(`user ${ADMIN_EMAIL} already exists — role set to admin`);
 } else {
  const [createdUser] = await db
   .insert(user)
   .values({
    id: crypto.randomUUID(),
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
   })
   .returning();

  userId = createdUser.id;

  console.log(`admin user ${ADMIN_EMAIL} created`);
 }

 const [existingAccount] = await db
  .select()
  .from(account)
  .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
  .limit(1);

 if (existingAccount) {
  await db
   .update(account)
   .set({ password: passwordHash, updatedAt: now })
   .where(eq(account.id, existingAccount.id));
 } else {
  await db.insert(account).values({
   id: crypto.randomUUID(),
   accountId: userId,
   providerId: "credential",
   userId,
   password: passwordHash,
   createdAt: now,
   updatedAt: now,
  });
 }

 console.log(`credentials updated for ${ADMIN_EMAIL}`);

 return { id: userId, email: ADMIN_EMAIL };
}

const invokedDirectly = process.argv[1]?.includes("admin.seed");

if (invokedDirectly) {
 seedAdmin()
  .then(({ id }) => {
   console.log(`admin seeded successfully (id: ${id})`);
   console.log("sign in at POST /api/auth/sign-in/email");
   if (!process.env.ADMIN_PASSWORD) {
    console.warn("using default password — set ADMIN_PASSWORD in production");
   }
  })
  .catch((err) => {
   console.error("failed to seed admin:", err);
   process.exitCode = 1;
  })
  .finally(async () => {
   await db.$client.end();
  });
}
