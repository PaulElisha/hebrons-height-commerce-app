/** @format */

import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";

export const pushSubscription = pgTable("push_subscription", {
 id: text("id")
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID()),
 userId: text("user_id")
  .notNull()
  .references(() => user.id, { onDelete: "cascade" }),
 endpoint: text("endpoint").notNull(),
 keys: jsonb("keys").$type<{ auth: string; p256dh: string }>().notNull(),
 createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
