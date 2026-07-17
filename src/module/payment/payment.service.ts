/** @format */
import { and, eq } from "drizzle-orm";
import Env from "env.ts";
import Stripe from "stripe";
import z from "zod";

import db from "@db/db.ts";

import OrderService from "@module/order/order.service.ts";

import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import { EventType } from "@shared/event-bus/config.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";
import { Result } from "@shared/types.ts";

import { payment } from "@schema/payment.ts";

import { FetchRail } from "./dispatcher.ts";

export const PaymentData = z.object({
 email: z.string().email(),
 amount: z.number().positive(),
 currency: z.string(),
 rail: z.string(),
 callback_url: z.url().optional(),
 mode: z.custom<Stripe.Checkout.SessionCreateParams.Mode>().optional(),
});

export const CheckoutData = z.object({
 email: z.string().email(),
 amount: z.number().positive(),
 currency: z.string(),
 rail: z.string(),
 metadata: z.record(z.string(), z.any()).optional(),
 callback_url: z.url().optional(),
 mode: z.custom<Stripe.Checkout.SessionCreateParams.Mode>().optional(),
});

export const PaymentResponse = z.object({
 checkout_url: z.string().url(),
 reference: z.string().optional(),
 access_code: z.string().optional(),
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

class PaymentService {
 createPayment = async (
  userId: string,
  orderId: string,
  paymentData: z.infer<typeof PaymentData>,
 ): Promise<Result<TPayment, AppError>> => {
  const [data, e] = await OrderService.getOrderDetails(userId, orderId);

  if (e || !data) return [null, e];

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
    email: paymentData.email,
    userId: userId,
    mode: paymentData.mode,
    rail: paymentData.rail,
    amount: paymentData.amount,
    callbackUrl: paymentData.callback_url,
    currency: paymentData.currency,
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
  checkout: z.infer<typeof CheckoutData>,
 ): Promise<Result<z.infer<typeof PaymentResponse>, AppError>> => {
  const rail = checkout.rail;

  const callback = FetchRail[rail];
  let paymentResponse, e;

  if (typeof rail === "string" && rail == "initializePaystackCheckout") {
   [paymentResponse, e] = await callback(userId, orderId, checkout);
  } else if (typeof rail === "string" && rail == "initializeStripeCheckout") {
   [paymentResponse, e] = await callback(userId, orderId, checkout);
  }
  return [paymentResponse, e];
 };

 // verifyPaystack = async (paymentReference: string) => {
 //  const response = await fetch(
 //   `${Env.PAYSTACK_VERIFY_URL}/${paymentReference}`,
 //   {
 //    method: "GET",
 //    headers: {
 //     Authorization: `Bearer ${Env.PAYSTACK_SECRET_KEY}`,
 //     "Content-Type": "application/json",
 //    },
 //   },
 //  );

 //  if (!response.ok)
 //   return [
 //    null,
 //    new BadRequestException(
 //     "Payment verification error",
 //     HttpStatus.BAD_REQUEST,
 //     ErrorCode.VALIDATION_ERROR,
 //    ),
 //   ];

 //  const responseData = await response.json();

 //  console.log("Verify data:", responseData.data);

 //  if (responseData.data)
 //   PublishEvent({
 //    event_type: EventType.PAYSTACK_PAYMENT_VERIFIED,
 //    payload: {
 //     data: responseData.data,
 //     provider: "paystack",
 //    },
 //   });

 //  return [responseData.data, null];
 // };
}

export default new PaymentService();
