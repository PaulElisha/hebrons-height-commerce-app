/** @format */

import db from "@db/db.ts";
import { order } from "@schema/order.ts";
import { payment } from "@schema/payment.ts";
import { EventContract, EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";
import { and, eq } from "drizzle-orm";

onEvent<EventContract>(EventType.PAYMENT_INITIALIZED).subscribe({
 next: async (payload) => {
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
    .where(and(eq(order.id, orderId)));
  }

  await db
   .update(payment)
   .set({
    status: "initialized",
    accessCode: paystackData.access_code,
    paymentReference: paystackData.reference,
    authorizationUrl: paystackData.authorization_url,
    paymentProvider: provider,
    updatedAt: new Date(Date.now()),
   })
   .where(and(eq(order.id, orderId)));
 },
 error: (error) => {
  console.error(error);
 },
});

onEvent<EventContract>(EventType.PAYMENT_VERIFIED).subscribe({
 next: async (payload) => {
  const { provider, reference, status, metadata, orderId } = payload.payload;

  await db
   .update(order)
   .set({
    orderStatus: "fulfilled",
    paymentStatus: "paid",
    updatedAt: new Date(Date.now()),
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
  }

  await db
   .update(payment)
   .set({
    status: "paid",
    updatedAt: new Date(Date.now()),
   })
   .where(and(eq(order.id, orderId), eq(payment.paymentProvider, provider)));
 },
 error: (error) => {
  console.error(error);
 },
});
