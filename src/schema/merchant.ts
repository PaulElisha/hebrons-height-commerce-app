/** @format */

import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
export const merchantStatuses: [string, string, string] = [
 "pending",
 "approved",
 "rejected",
] as const;
export type MerchantStatus = (typeof merchantStatuses)[number];

export const merchant = pgTable(
 "merchant",
 {
  id: text("id")
   .primaryKey()
   .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
   .notNull()
   .unique()
   .references(() => user.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  businessLogo: text("business_logo").notNull(),
  businessDescription: text("business_description").notNull(),
  address: text("address").notNull(),
  approvalStatus: text("approval_status")
   .$type<MerchantStatus>()
   .notNull()
   .default("pending"),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
 },
 (table) => [
  check(
   "approval_status_check",
   sql`${table.approvalStatus} IN (${sql.join(
    merchantStatuses.map((s) => sql.raw(`'${s}'`)),
    sql`, `,
   )})`,
  ),
 ],
);
