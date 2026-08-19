/** @format */

import db from "@db/db.ts";
import PaymentService, {
 PaymentData,
} from "@module/payment/payment.service.ts";
import { order } from "@db/schema/order.ts";
import { payment } from "@db/schema/payment.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { EventType, PaystackChargeEvent } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { Result, T, TPaymentVerificationResult } from "@shared/types.ts";
import { eq } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
import Env from "env.ts";
import Stripe from "stripe";
import z from "zod";

class WebhookHandler {
 @Transactional()
 async handlePaymentInitialized(
  userId: string,
  orderId: string,
  paymentData: z.infer<typeof PaymentData>,
 ): Promise<Result<T<"payment">, AppError>> {
  const [paymentRecord, err] = await PaymentService.createPayment(
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

  if (!paymentRecord) return [null, APIError.notFound("Payment not found")];

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

  if (paidAmount !== recordedAmount)
   return [null, APIError.badRequest("Payment amount mismatch")];

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

  await publishEvent({
   event_type: EventType.PAYMENT_FULFILLED,
   userId: updatedOrder.userId,
   payload: {
    updatedPayment,
    updatedOrder,
   },
  });

  return [{ payment: updatedPayment, order: updatedOrder }, null];
 }

 async handlePaystackPaymentVerified(
  event: PaystackChargeEvent,
 ): Promise<Result<TPaymentVerificationResult, AppError>> {
  const reference = event.data?.reference;
  const paidAmount = Number(event.data?.amount) / Env.SCALER;
  const paidAtDate = event.data?.paid_at
   ? new Date(event.data.paid_at)
   : new Date();
  const isFailure = event.event === "charge.failed";

  if (!reference)
   return [null, APIError.badRequest("Missing payment reference")];

  return await this.verifyPayment(reference, paidAmount, paidAtDate, isFailure);
 }

 async handleStripePaymentVerified(
  session: Stripe.Checkout.Session,
  eventType: string,
 ): Promise<Result<TPaymentVerificationResult, AppError>> {
  const reference = session.id;
  const paidAmount = Number(session.amount_total) / Env.SCALER;
  const paidAtDate = session.created
   ? new Date(session.created * 1000)
   : new Date();
  const isFailure = eventType === "checkout.session.expired";

  return await this.verifyPayment(reference, paidAmount, paidAtDate, isFailure);
 }
}

export default new WebhookHandler();
