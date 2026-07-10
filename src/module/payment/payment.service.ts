/** @format */
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { payment } from "@schema/payment.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import { Result } from "@shared/types.ts";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";

import { FetchRail } from "./dispatcher.ts";
import Env from "env.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";
import { EventType } from "@shared/event-bus/config.ts";
import z from "zod";

export const CheckoutData = z.object({
 email: z.string().email(),
 amount: z.number().positive(),
 currency: z.string(),
 rail: z.string(),
 callback_url: z.url().optional(),
 mode: z.custom<Stripe.Checkout.SessionCreateParams.Mode>().optional(),
});

interface TPayment {
 email: string;
 amount: number | null;
 currency: string | null;
 rail: string;
 mode: string | null;
 id: string;
 createdAt: Date;
 updatedAt: Date;
 userId: string;
 status: string;
 orderId: string;
 attempts: number | null;
 callbackUrl: string | null;
 paymentReference: string | null;
 paymentProvider: string | null;
 accessCode: string | null;
 authorizationUrl: string | null;
 paidAt: Date | null;
}

export interface PaymentData {
 email: string;
 currency: string;
 rail: string;
 callback_url?: string;
 metadata?: Record<string, any>;
 mode?: Stripe.Checkout.SessionCreateParams.Mode;
}

class PaymentService {
 initialize = async (
  userId: string,
  orderId: string,
  checkoutData: z.infer<typeof CheckoutData>,
 ): Promise<Result<TPayment, AppError>> => {
  const [data, e] = await OrderService.getOrderDetails(userId, orderId);

  if (data == null) return [null, e];

  if (
   data.order.orderStatus !== "pending" &&
   data.order.paymentStatus !== "pending"
  ) {
   return [
    null,
    new BadRequestException(
     "Invalid order",
     HttpStatus.UNPROCESSABLE_ENTITY,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];
  }

  const [paymentExists] = await db
   .select()
   .from(payment)
   .where(and(eq(payment.orderId, orderId)));

  if (paymentExists) {
   return [
    null,
    new BadRequestException(
     "Payment already created",
     HttpStatus.CONFLICT,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];
  }

  const [paymentCreated] = await db
   .insert(payment)
   .values({
    orderId: orderId,
    email: checkoutData.email,
    userId: userId,
    mode: checkoutData.mode,
    rail: checkoutData.rail,
    amount: checkoutData.amount,
    callbackUrl: checkoutData.callback_url,
    currency: checkoutData.currency,
    attempts: 2,
   })
   .returning();

  if (!paymentCreated) {
   return [
    null,
    new InternalServerError(
     "Failed to initialize payment",
     HttpStatus.INTERNAL_SERVER_ERROR,
     ErrorCode.INTERNAL_SERVER_ERROR,
    ),
   ];
  }

  return [paymentCreated, null];
 };

 fetchPaymentForOrderByRail = async (
  userId: string,
  orderId: string,
  paymentData: PaymentData,
 ): Promise<Result<any, AppError>> => {
  const [paymentRecord] = await db
   .select()
   .from(payment)
   .where(and(eq(payment.orderId, orderId)));

  if (!paymentRecord || paymentRecord.rail !== paymentData.rail) {
   return [
    null,
    new InternalServerError(
     "Invalid payment rail",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  const rail = paymentData.rail;

  const callback = FetchRail[rail];
  let url, e;

  if (typeof rail === "string" && rail == "initializePaystackCheckout") {
   [url, e] = await callback(userId, orderId, paymentData);
  } else if (typeof rail === "string" && rail == "initializeStripeCheckout") {
   [url, e] = await callback(userId, orderId, paymentData);
  }

  return [url, e];
 };

 verifyPaystack = async (paymentReference: string) => {
  const response = await fetch(
   `${Env.PAYSTACK_VERIFY_URL}/${paymentReference}`,
   {
    method: "GET",
    headers: {
     Authorization: `Bearer ${Env.PAYSTACK_SECRET_KEY}`,
     "Content-Type": "application/json",
    },
   },
  );

  if (!response.ok)
   return [
    null,
    new BadRequestException(
     "Payment verification error",
     HttpStatus.BAD_REQUEST,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];

  const responseData = (await response.json()) as any;

  PublishEvent({
   event_type: EventType.PAYMENT_VERIFIED,
   payload: {
    ...responseData,
    provider: "paystack",
   },
  });

  return [responseData, null];
 };
}

export default new PaymentService();
