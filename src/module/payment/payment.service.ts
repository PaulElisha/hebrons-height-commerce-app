/** @format */
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { order } from "@schema/order.ts";
import { payment } from "@schema/payment.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import NotFoundException from "@shared/error/not-found.ts";
import { Result } from "@shared/types.ts";
import { and, eq } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
import Env from "env.ts";
import Stripe from "stripe";
import z from "zod";

import { FetchRail } from "./dispatcher.ts";
import CartBase from "@module/cart/base.ts";

export const PaymentData = z.object({
 email: z.string().email(),
 amount: z.number().positive(),
 currency: z.string(),
 paymentProvider: z.string(),
 rail: z.string(),
 callback_url: z.url().optional(),
 checkout_url: z.string(),
 access_code: z.string().optional(),
 reference: z.string().optional(),
 mode: z.custom<Stripe.Checkout.SessionCreateParams.Mode>().optional(),
});

export const CheckoutData = z.object({
 email: z.string().email(),
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

interface TPaymentVerificationResult {
 payment: any;
 order?: any;
}

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
 fetchPaymentForOrderByRail = async (
  userId: string,
  orderId: string,
  checkout: z.infer<typeof CheckoutData>,
 ): Promise<Result<z.infer<typeof PaymentResponse>, AppError>> => {
  const rail = checkout.rail;

  const callback = FetchRail[rail];
  let paymentResponse, err;

  if (typeof rail === "string" && rail == "initializePaystackCheckout") {
   [paymentResponse, err] = await callback(userId, orderId, checkout);
  } else if (typeof rail === "string" && rail == "initializeStripeCheckout") {
   [paymentResponse, err] = await callback(userId, orderId, checkout);
  }
  return [paymentResponse, err];
 };

 createPayment = async (
  userId: string,
  orderId: string,
  paymentData: z.infer<typeof PaymentData>,
 ): Promise<Result<TPayment, AppError>> => {
  const [data, err] = await OrderService.getOrderDetails(userId, orderId);

  if (err || !data) return [null, err];

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
    authorizationUrl: paymentData.checkout_url,
    accessCode: paymentData.access_code,
    paymentReference: paymentData.reference,
    currency: paymentData.currency,
    paymentProvider: paymentData.paymentProvider,
    attempts: 2,
   })
   .returning();

  return [paymentCreated, null];
 };

 @Transactional()
 async handlePaymentInitialized(
  userId: string,
  orderId: string,
  paymentData: z.infer<typeof PaymentData>,
 ): Promise<Result<TPayment, AppError>> {
  const [paymentRecord, err] = await this.createPayment(
   userId,
   orderId,
   paymentData,
  );
  if (err || !paymentRecord) return [null, err];

  await db
   .update(order)
   .set({
    orderStatus: "processing",
    paymentStatus: "processing",
    updatedAt: new Date(),
   })
   .where(eq(order.id, orderId));

  return [paymentRecord, null];
 }

 @Transactional()
 async verifyPayment(
  reference: string,
  paidAmount: number,
  paidAtDate: Date,
  isFailure: boolean,
 ): Promise<Result<TPaymentVerificationResult, AppError>> {
  const [paymentRecord] = await db
   .select()
   .from(payment)
   .where(eq(payment.paymentReference, reference))
   .for("update");

  if (!paymentRecord) {
   return [
    null,
    new NotFoundException(
     "Payment not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  if (paymentRecord.status === "paid" || paymentRecord.status === "failed") {
   return [{ payment: paymentRecord }, null];
  }

  if (isFailure) {
   const [updatedPayment] = await db
    .update(payment)
    .set({
     status: "failed",
     updatedAt: new Date(),
     attempts: 1,
    })
    .where(eq(payment.id, paymentRecord.id))
    .returning();

   const [updatedOrder] = await db
    .update(order)
    .set({
     orderStatus: "failed",
     paymentStatus: "failed",
     updatedAt: new Date(),
    })
    .where(eq(order.id, paymentRecord.orderId))
    .returning();

   return [{ payment: updatedPayment, order: updatedOrder }, null];
  }

  const recordedAmount = Number(paymentRecord.amount) / Env.SCALER;

  if (paidAmount !== recordedAmount) {
   return [
    null,
    new BadRequestException(
     "Payment amount mismatch",
     HttpStatus.BAD_REQUEST,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];
  }

  const [updatedPayment] = await db
   .update(payment)
   .set({
    status: "paid",
    paidAt: paidAtDate,
    updatedAt: new Date(),
   })
   .where(eq(payment.orderId, paymentRecord.orderId))
   .returning();

  const [updatedOrder] = await db
   .update(order)
   .set({
    paymentStatus: "paid",
    orderStatus: "fulfilled",
    updatedAt: new Date(),
   })
   .where(eq(order.id, paymentRecord.orderId))
   .returning();

  await db.delete(cartItem).where(eq(cartItem.userId, paymentRecord.userId));
  await CartBase.calculateTotalAmount(
   updatedOrder.cartId,
   paymentRecord.userId,
  );

  return [{ payment: updatedPayment, order: updatedOrder }, null];
 }

 async handlePaystackPaymentVerified(
  event: any,
 ): Promise<Result<TPaymentVerificationResult, AppError>> {
  const reference = event.data?.reference;
  const paidAmount = Number(event.data?.amount) / Env.SCALER;
  const paidAtDate = event.data?.paid_at
   ? new Date(event.data.paid_at)
   : new Date();
  const isFailure = event.event === "charge.failed";

  return await this.verifyPayment(reference, paidAmount, paidAtDate, isFailure);
 }

 async handleStripePaymentVerified(
  session: any,
  eventType: string,
 ): Promise<Result<TPaymentVerificationResult, AppError>> {
  const reference = session.id;
  const paidAmount = Number(session.amount_total) / Env.SCALER;
  const paidAtDate = session.payment_intent?.created
   ? new Date(session.payment_intent.created * 1000)
   : new Date();
  const isFailure = eventType === "checkout.session.expired";

  return await this.verifyPayment(reference, paidAmount, paidAtDate, isFailure);
 }
}

export default new PaymentService();
