/** @format */

import { sql } from "drizzle-orm";
import {
 check,
 integer,
 jsonb,
 pgTable,
 text,
 timestamp,
} from "drizzle-orm/pg-core";

import { merchant } from "./merchant.ts";

export const productStatuses: [string, string] = [
 "available",
 "sold_out",
] as const;
export type ProductStatus = (typeof productStatuses)[number];

export const product = pgTable(
 "product",
 {
  id: text("id")
   .primaryKey()
   .$defaultFn(() => crypto.randomUUID()),
  merchantId: text("merchant_id").references(() => merchant.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  additionalImages: jsonb("additional_images").$type<string[]>(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  category: text("category").notNull(),
  subCategory: text("sub_category").notNull(),
  status: text("product_status")
   .$type<ProductStatus>()
   .notNull()
   .default("available"),
  additionalData: jsonb("additional_data").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
 },
 (table) => [
  check(
   "product_status_check",
   sql`${table.status} IN (${sql.join(
    productStatuses.map((s) => sql.raw(`'${s}'`)),
    sql`, `,
   )})`,
  ),
 ],
);
