/** @format */

import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth.ts";
import { product } from "./product.ts";

export const cart = pgTable("cart", {
 id: text("id")
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID()),
 userId: text("user_id")
  .notNull()
  .references(() => user.id)
  .unique(),
 subtotal: integer("subtotal"),
 createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
 updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const cartItem = pgTable(
 "cart_items",
 {
  id: text("id")
   .primaryKey()
   .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
   .notNull()
   .references(() => user.id),
  cartId: text("cart_id")
   .notNull()
   .references(() => cart.id),
  productId: text("product_id")
   .notNull()
   .references(() => product.id),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
  totalItemPrice: integer("total_item_price"),
 },
 (t) => [index("cartMealUnq").on(t.cartId, t.productId)],
);
