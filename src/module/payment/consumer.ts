/** @format */

import db from "@db/db.ts";
import { formatErrorPayload } from "@module/inventory/consumer.ts";
import { order } from "@schema/order.ts";
import { payment } from "@schema/payment.ts";
import { EventContract, EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";
import { and, eq } from "drizzle-orm";

onEvent<EventContract>(EventType.PAYMENT_INITIALIZED).subscribe({
 next: async (payload) => {
  try {
   const { provider, paystackData, checkoutUrl, orderId } = payload.payload;

   await db
    .update(order)
    .set({
     orderStatus: "processing",
     paymentStatus: "processing",
     updatedAt: new Date(Date.now()),
    })
    .where(eq(order.id, orderId));

   if (provider === "stripe") {
    await db
     .update(payment)
     .set({
      status: "initialized",
      authorizationUrl: checkoutUrl,
      paymentProvider: provider,
      updatedAt: new Date(Date.now()),
     })
     .where(eq(order.id, orderId));
   } else if (provider === "paystack") {
    await db
     .update(payment)
     .set({
      status: "initialized",
      accessCode: paystackData.access_code,
      paymentReference: paystackData.reference,
      authorizationUrl: paystackData.authorization_url,
      paymentProvider: provider,
      updatedAt: new Date(),
     })
     .where(eq(order.id, orderId));
   }
  } catch (error) {
   const formatted = formatErrorPayload(error as Error);
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (error) => {
  console.error(error);
 },
});

onEvent<EventContract>(EventType.PAYMENT_VERIFIED).subscribe({
 next: async (payload) => {
  try {
   const { provider, reference, orderId } = payload.payload;

   await db
    .update(order)
    .set({
     orderStatus: "fulfilled",
     paymentStatus: "paid",
     updatedAt: new Date(),
    })
    .where(eq(order.id, orderId));

   if (provider === "stripe") {
    await db
     .update(payment)
     .set({
      paidAt: new Date(Date.now()),
      status: "paid",
      paymentReference: reference,
      updatedAt: new Date(Date.now()),
     })
     .where(and(eq(order.id, orderId), eq(payment.paymentProvider, provider)));
   } else if (provider === "paystack") {
    await db
     .update(payment)
     .set({
      status: "paid",
      paidAt: new Date(),
      updatedAt: new Date(),
     })
     .where(and(eq(order.id, orderId), eq(payment.paymentProvider, provider)));
   }
  } catch (error) {
   const formatted = formatErrorPayload(error as Error);
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (error) => {
  console.error(error);
 },
});
