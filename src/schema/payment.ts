/** @format */

import { sql } from "drizzle-orm";
import {
 check,
 integer,
 jsonb,
 pgTable,
 text,
 timestamp,
 varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
import { order } from "./order.ts";

export const paymentStatuses: readonly [
 string,
 string,
 string,
 string,
 string,
] = ["pending", "paid", "failed", "cancelled", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const payment = pgTable(
 "payment",
 {
  id: text("id")
   .primaryKey()
   .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
   .notNull()
   .references(() => order.id)
   .unique(),
  userId: text("user_id")
   .notNull()
   .references(() => user.id),
  amount: integer("amount"),
  currency: varchar("currency", { length: 255 }),
  status: text("payment_status")
   .$type<PaymentStatus>()
   .notNull()
   .default("pending"),
  attempts: integer("attempts"),
  mode: text("mode"),
  rail: text("rail").notNull(),
  channels: jsonb("channels").$type<string[]>(),
  paymentReference: text("payment_reference").$defaultFn(() =>
   crypto.randomUUID(),
  ),
  paymentProvider: text("payment_provider"),
  accessCode: varchar("access_code", { length: 255 }),
  authorizationUrl: text("authorization_url"),
  transactionId: text("transaction_id"),
  paidAt: timestamp("paidAt", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
 },
 (table) => [
  check(
   "payment_status_check",
   sql`${table.status} IN (${sql.join(
    paymentStatuses.map((s) => sql.raw(`'${s}'`)),
    sql`, `,
   )})`,
  ),
 ],
);
