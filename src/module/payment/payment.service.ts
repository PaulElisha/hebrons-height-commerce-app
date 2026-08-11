/** @format */
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { order } from "@schema/order.ts";
import { payment } from "@schema/payment.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { Result, T } from "@shared/types.ts";
import { eq } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
import Stripe from "stripe";
import z from "zod";

import { FetchRail } from "./dispatcher.ts";

export const CheckoutData = z.object({
 email: z.string().email(),
 currency: z.string(),
 rail: z.enum(["initializePaystackCheckout", "initializeStripeCheckout"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
 callback_url: z.url().optional(),
 mode: z.custom<Stripe.Checkout.SessionCreateParams.Mode>().optional(),
});

export const PaymentData = CheckoutData.extend({
 amount: z.number().positive().optional(),
 paymentProvider: z.string(),
 checkout_url: z.string(),
 access_code: z.string().optional(),
 reference: z.string().optional(),
});

export type PaymentCheckoutResult = Omit<
 z.infer<typeof PaymentData>,
 "paymentProvider"
> & { callbackUrl?: string };

class PaymentService {
 fetchPaymentForOrderByRail = async (
  userId: string,
  orderId: string,
  checkout: z.infer<typeof CheckoutData>,
 ): Promise<Result<PaymentCheckoutResult, AppError>> => {
  const [paymentResponse, err] = await FetchRail[checkout.rail](
   userId,
   orderId,
   checkout,
  );

  return [paymentResponse, err];
 };

 @Transactional()
 async createPayment(
  userId: string,
  orderId: string,
  paymentData: z.infer<typeof PaymentData>,
 ): Promise<Result<T<"payment">, AppError>> {
  const [data, err] = await OrderService.getOrderDetails(userId, orderId);

  if (err || !data) return [null, err];

  await db.select().from(order).where(eq(order.id, orderId)).for("update");

  const [existingPayment] = await db
   .select()
   .from(payment)
   .where(eq(payment.orderId, orderId))
   .limit(1);

  if (existingPayment) {
   if (existingPayment.status === "paid") return [existingPayment, null];

   if (
    data.order.orderStatus === "cancelled" ||
    data.order.paymentStatus === "cancelled"
   ) {
    return [null, APIError.badRequest("Invalid order")];
   }

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
     status: existingPayment.status === "failed" ? "pending" : existingPayment.status,
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
    attempts: 2,
   })
   .returning();

  return [paymentCreated, null];
 }
}

export default new PaymentService();
