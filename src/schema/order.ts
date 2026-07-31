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

import { user } from "./auth.ts";
import { cart } from "./cart.ts";
import { merchant } from "./merchant.ts";

export const orderStatuses: readonly [
 string,
 string,
 string,
 string,
 string,
 string,
 string,
] = [
 "pending",
 "processing",
 "fulfilled",
 "failed",
 "out_for_delivery",
 "delivered",
 "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentStatuses: readonly [
 string,
 string,
 string,
 string,
 string,
 string,
] = [
 "pending",
 "processing",
 "paid",
 "failed",
 "cancelled",
 "refunded",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const order = pgTable(
 "orders",
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
  subtotal: integer("subtotal").notNull(),
  serviceCharge: integer("service_charge").default(0),
  deliveryFee: integer("delivery_fee").default(0),
  taxAmount: integer("tax_amount").default(0),
  discountAmount: integer("discount_amount").default(0),
  deliveryAddress: jsonb("delivery_address")
   .$type<Record<string, string>>()
   .notNull(),
  orderStatus: text("order_status")
   .$type<OrderStatus>()
   .notNull()
   .default("pending"),
  paymentStatus: text("payment_status")
   .$type<PaymentStatus>()
   .notNull()
   .default("pending"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
 },
 (table) => [
  check(
   "order_status_check",
   sql`${table.orderStatus} IN (${sql.join(
    orderStatuses.map((s) => sql.raw(`'${s}'`)),
    sql`, `,
   )})`,
  ),
  check(
   "payment_status_check",
   sql`${table.paymentStatus} IN (${sql.join(
    paymentStatuses.map((s) => sql.raw(`'${s}'`)),
    sql`, `,
   )})`,
  ),
  index("order_user_status_idx").on(table.userId, table.orderStatus),
  index("order_cart_idx").on(table.cartId),
  index("order_status_created_idx").on(table.orderStatus, table.createdAt),
 ],
);

export const orderItem = pgTable(
 "orderItem",
 {
  id: text("id")
   .primaryKey()
   .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
   .notNull()
   .references(() => order.id),
  merchantId: text("merchant_id")
   .notNull()
   .references(() => merchant.id),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total"),
 },
 (table) => [
  index("order_item_order_idx").on(table.orderId),
  index("order_item_merchant_idx").on(table.merchantId),
  index("order_item_product_idx").on(table.productId),
 ],
);
