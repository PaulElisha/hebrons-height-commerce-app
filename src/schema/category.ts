/** @format */

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const category = pgTable("category", {
 id: text("id")
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID()),
 name: text("name").notNull().unique(),
 description: text("description"),
 createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
 updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const subcategory = pgTable("subcategory", {
 id: text("id")
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID()),
 categoryId: text("category_id")
  .notNull()
  .references(() => category.id, { onDelete: "cascade" }),
 name: text("name").notNull(),
 createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
