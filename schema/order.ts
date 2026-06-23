/** @format */

import { sql } from "drizzle-orm";
import {
 integer,
 jsonb,
 pgTable,
 timestamp,
 text,
 check,
 varchar,
 index,
} from "drizzle-orm/pg-core";

import { product } from "./product";
import { merchant } from "./merchant";
import { user } from "./auth";
import { cart } from "./cart";

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
 "confirmed",
 "processing",
 "paid",
 "out_for_delivery",
 "delivered",
 "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentStatuses: readonly [string, string, string, string] = [
 "pending",
 "paid",
 "failed",
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
   .references(() => order.id, { onDelete: "cascade" }),
  merchantId: text("merchant_id")
   .notNull()
   .references(() => merchant.id),
  productId: text("product_id")
   .notNull()
   .references(() => product.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total"),
 },
 (t) => [index("cartMealUnq").on(t.orderId, t.merchantId)],
);
