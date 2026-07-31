/** @format */

import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";

export const notificationTypes: readonly [string, string, string] = [
 "order_update",
 "stock_alert",
 "system",
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notification = pgTable(
 "notification",
 {
  id: text("id")
   .primaryKey()
   .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
   .notNull()
   .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").$type<NotificationType>().notNull(),
  read: text("read_status").notNull().default("unread"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
 },
 (t) => [
  index("notification_user_created_idx").on(t.userId, t.createdAt),
  index("notification_user_read_idx").on(t.userId, t.read),
 ],
);
