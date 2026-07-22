/** @format */

import db from "@db/db.ts";
import CartBase from "@module/cart/base.ts";
import PaymentService, {
 PaymentData,
} from "@module/payment/payment.service.ts";
import { cartItem } from "@schema/cart.ts";
import { order } from "@schema/order.ts";
import { payment } from "@schema/payment.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import NotFoundException from "@shared/error/not-found.ts";
import { Result, TPayment, TPaymentVerificationResult } from "@shared/types.ts";
import { eq } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
import Env from "env.ts";
import z from "zod";

class WebhookHandler {
 @Transactional()
 async handlePaymentInitialized(
  userId: string,
  orderId: string,
  paymentData: z.infer<typeof PaymentData>,
 ): Promise<Result<TPayment, AppError>> {
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

export default new WebhookHandler();
