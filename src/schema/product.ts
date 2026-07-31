/** @format */

import { sql } from "drizzle-orm";
import {
 check,
 index,
 integer,
 jsonb,
 pgTable,
 text,
 timestamp,
} from "drizzle-orm/pg-core";

import { category, subcategory } from "./category.ts";
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
  categoryId: text("category_id").references(() => category.id),
  subCategoryId: text("sub_category_id").references(() => subcategory.id),
  category: text("category").notNull(),
  subCategory: text("sub_category").notNull(),
  status: text("product_status")
   .$type<ProductStatus>()
   .notNull()
   .default("available"),
  additionalData: jsonb("additional_data").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
 },
 (table) => [
  check(
   "product_status_check",
   sql`${table.status} IN (${sql.join(
    productStatuses.map((s) => sql.raw(`'${s}'`)),
    sql`, `,
   )})`,
  ),
  index("product_merchant_idx").on(table.merchantId),
  index("product_category_subcategory_idx").on(
   table.category,
   table.subCategory,
  ),
  index("product_subcategory_id_idx").on(table.subCategoryId),
  index("product_listing_idx")
   .on(table.status, table.createdAt)
   .where(sql`${table.deletedAt} IS NULL`),
  index("product_search_idx").using(
   "gin",
   table.name.op("gin_trgm_ops"),
   table.description.op("gin_trgm_ops"),
  ),
 ],
);
