/** @format */
// import Env from "@/env.ts"; // Paystack only
import bachsClient from "@app/bachs.ts";
import logger from "@app/logger.ts";
import db from "@db/db.ts";
import { order } from "@db/schema/order.ts";
import { payment } from "@db/schema/payment.ts";
import OrderService from "@module/order/order.service.ts";
import * as APIError from "@shared/error/APIError.ts";
import asError from "@shared/error/as-error.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { Result, TPayment } from "@shared/types.ts";
import Handler from "@webhook/handler/payment.handler.ts";
import { eq } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
import z from "zod";

import { FetchRail } from "./dispatcher.ts";
import { CheckoutSessionResponse } from "@bachs/sdk";

export const VerifyPaymentParams = z.object({
 reference: z.string(),
});

export const CheckoutData = z.object({
 email: z.email(),
 currency: z.string(),
 rail: z.enum([
  // "initializePaystackCheckout",
  // "initializeStripeCheckout",
  "initializeBachsCheckout",
  "initializeBachsCardCheckout",
  "initializeBachsBankTransferCheckout",
  "initializeBachsMobileMoneyCheckout",
  "initializeBachsCryptoCheckout",
 ]),
 metadata: z.record(z.string(), z.unknown()).optional(),
 callback_url: z.url().optional(),
 mode: z.enum(["payment", "setup", "subscription"]).optional(),
});

export const PaymentData = CheckoutData.extend({
 amount: z.number().positive().optional(),
 paymentProvider: z.string(),
 checkout_url: z.string(),
 access_code: z.string().optional(),
 reference: z.string().optional(),
});

export type PaymentResponseData = z.infer<typeof PaymentData> & {
 callbackUrl?: string;
};

// Paystack only
/*
export interface PaystackVerifiedData {
 status: string;
 reference: string;
 amount: number;
 currency: string;
 paid_at: string;
 channel?: string;
 customer?: Record<string, unknown>;
 authorization?: Record<string, unknown>;
 [key: string]: unknown;
}
*/

const withOrderDbLock = async <T>(
 orderId: string,
 fn: () => Promise<T>,
): Promise<T> => {
 const client = await db.$client.connect();
 let destroyed = false;

 try {
  await client.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", [
   orderId,
  ]);

  try {
   return await fn();
  } finally {
   try {
    await client.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [
     orderId,
    ]);
   } catch (err) {
    destroyed = true;
    client.release(true);
    throw err;
   }
  }
 } finally {
  if (!destroyed) client.release();
 }
};

class PaymentService {
 fetchPaymentForOrderByRail = async (
  userId: string,
  orderId: string,
  checkout: z.infer<typeof CheckoutData>,
 ): Promise<Result<PaymentResponseData>> => {
  try {
   const rail = FetchRail[checkout.rail];

   if (!rail) return [null, APIError.badRequest("Unsupported payment rail")];

   const [paymentResponse, err] = await withOrderDbLock(orderId, () =>
    rail(userId, orderId, checkout),
   );

   if (err || !paymentResponse) return [paymentResponse, err];

   const [, initErr] = await Handler.handlePaymentInitialized(
    userId,
    orderId,
    paymentResponse,
   );

   if (initErr) return [null, initErr];

   try {
    await publishEvent({
     event_type: EventType.PAYMENT_INITIALIZED,
     payload: { userId, orderId, paymentResponseData: paymentResponse },
    });
   } catch (notifyErr) {
    logger.error(
     { err: notifyErr, orderId },
     "[...Payment initialized notification failed]",
    );
   }

   return [paymentResponse, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 @Transactional()
 async createPayment(
  userId: string,
  orderId: string,
  paymentData: z.infer<typeof PaymentData>,
 ): Promise<Result<TPayment>> {
  const [data, err] = await OrderService.getOrderDetails(userId, orderId);

  if (err || !data) return [null, err];

  await db.select().from(order).where(eq(order.id, orderId)).for("update");

  if (data.order.orderStatus === "cancelled")
   return [null, APIError.badRequest("Invalid order")];

  if (data.order.orderStatus === "fulfilled")
   return [null, APIError.badRequest("Order already completed")];

  const [existingPayment] = await db
   .select()
   .from(payment)
   .where(eq(payment.orderId, orderId))
   .limit(1);

  if (existingPayment) {
   if (existingPayment.status === "paid") return [existingPayment, null];

   const orderInProgress =
    data.order.orderStatus === "processing" ||
    data.order.paymentStatus === "processing";

   const nextStatus =
    existingPayment.status === "initialized" && orderInProgress
     ? "initialized"
     : "pending";

   const [updatedPayment] = await db
    .update(payment)
    .set({
     email: paymentData.email,
     amount: paymentData.amount,
     currency: paymentData.currency,
     mode: paymentData.mode,
     rail: paymentData.rail,
     callbackUrl: paymentData.callback_url,
     paymentReference: paymentData.reference,
     paymentProvider: paymentData.paymentProvider,
     accessCode: paymentData.access_code,
     authorizationUrl: paymentData.checkout_url,
     status: nextStatus,
     updatedAt: new Date(),
    })
    .where(eq(payment.id, existingPayment.id))
    .returning();

   return [updatedPayment ?? existingPayment, null];
  }

  if (
   data.order.orderStatus !== "pending" &&
   data.order.paymentStatus !== "pending"
  ) {
   return [null, APIError.badRequest("Invalid order")];
  }

  const [paymentCreated] = await db
   .insert(payment)
   .values({
    orderId: orderId,
    email: paymentData.email,
    userId: userId,
    mode: paymentData.mode,
    rail: paymentData.rail,
    amount: paymentData.amount,
    callbackUrl: paymentData.callback_url,
    authorizationUrl: paymentData.checkout_url,
    accessCode: paymentData.access_code,
    paymentReference: paymentData.reference,
    currency: paymentData.currency,
    paymentProvider: paymentData.paymentProvider,
    attempts: 0,
   })
   .returning();

  return [paymentCreated, null];
 }

 verifyPayment = async (
  reference: string,
 ): Promise<Result<CheckoutSessionResponse>> => {
  try {
   const checkout = await bachsClient.checkoutSessions.get(reference);

   return [checkout, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 // verifyPayment = async (
 //  reference: string,
 // ): Promise<Result<PaystackVerifiedData>> => {
 //  try {
 //   const response = await fetch(`${Env.PAYSTACK_VERIFY_URL}/${reference}`, {
 //    method: "GET",
 //    headers: {
 //     Authorization: `Bearer ${Env.PAYSTACK_SECRET_KEY}`,
 //     "Content-Type": "application/json",
 //    },
 //   });
 //
 //   if (!response.ok) {
 //    const errBody = await response.json().catch((e: Error) => {
 //     logger.error(
 //      { err: String(e.message), reference },
 //      "[...Paystack error body]",
 //     );
 //     return { message: String(e.message ?? "Paystack Payment failed") };
 //    });
 //
 //    return [null, APIError.badRequest(errBody.message)];
 //   }
 //
 //   const responseData = await response.json();
 //
 //   if (!responseData.status || responseData.data?.status !== "success")
 //    return [null, APIError.badRequest("Payment not verified")];
 //
 //   return [responseData.data, null];
 //  } catch (err) {
 //   return [null, asError(err)];
 //  }
 // };
}

export default new PaymentService();
