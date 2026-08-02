/** @format */
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { order } from "@schema/order.ts";
import { payment } from "@schema/payment.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { Result, T } from "@shared/types.ts";
import { and, eq } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
import Stripe from "stripe";
import z from "zod";

import { FetchRail } from "./dispatcher.ts";

export const CheckoutData = z.object({
 email: z.string().email(),
 currency: z.string(),
 rail: z.enum(["initializePaystackCheckout", "initializeStripeCheckout"]),
 metadata: z.record(z.string(), z.any()).optional(),
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

export const PaymentResponse = z.object({
 checkout_url: z.string().url(),
 reference: z.string().optional(),
 access_code: z.string().optional(),
});

class PaymentService {
 fetchPaymentForOrderByRail = async (
  userId: string,
  orderId: string,
  checkout: z.infer<typeof CheckoutData>,
 ): Promise<Result<z.infer<typeof PaymentResponse>, AppError>> => {
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

  if (
   data.order.orderStatus !== "pending" &&
   data.order.paymentStatus !== "pending"
  ) {
   return [null, APIError.badRequest("Invalid order")];
  }

  const [paymentExists] = await db
   .select()
   .from(payment)
   .where(and(eq(payment.orderId, orderId)));

  if (paymentExists) {
   return [null, APIError.badRequest("Payment already created")];
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
