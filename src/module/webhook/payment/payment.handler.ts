/** @format */

import db from "@db/db.ts";
import PaymentService, {
 PaymentData,
} from "@module/payment/payment.service.ts";
import { order, orderItem } from "@db/schema/order.ts";
import { payment } from "@db/schema/payment.ts";
import * as APIError from "@shared/error/APIError.ts";
import { EventType, ChargeEvent } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { Result, TPayment, TPaymentVerificationResult } from "@shared/types.ts";
import { and, eq } from "drizzle-orm";
import { runOnTransactionCommit, Transactional } from "drizzle-transactional";
import Env from "@/env.ts";
import Stripe from "stripe";
import z from "zod";
import { getUserfromMerchantId } from "@shared/helper.ts";

class WebhookHandler {
 @Transactional()
 async handlePaymentInitialized(
  userId: string,
  orderId: string,
  paymentData: z.infer<typeof PaymentData>,
 ): Promise<Result<TPayment>> {
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

  if (paymentRecord.status === "pending") {
   await db
    .update(payment)
    .set({
     status: "initialized",
     updatedAt: new Date(),
    })
    .where(eq(payment.id, paymentRecord.id));
  }

  const result = await db
   .select()
   .from(orderItem)
   .where(eq(orderItem.orderId, orderId));

  const merchantIds = result
   .filter((r) => r.merchantId)
   .map((r) => r.merchantId);

  const merchantUserIds = (await getUserfromMerchantId(merchantIds))
   .filter((r) => r.user.id === r.merchant?.userId)
   .map((r) => r.user.id);

  runOnTransactionCommit(() => {
   publishEvent({
    event_type: EventType.ORDER_STATUS_UPDATED,
    payload: {
     userId,
     orderId,
     status: "processing",
     merchantUserIds,
    },
   });
  });

  return [paymentRecord, null];
 }

 @Transactional()
 async handlePaymentFailure(
  paymentId: string,
 ): Promise<Result<TPaymentVerificationResult>> {
  const [paymentRecord] = await db
   .select()
   .from(payment)
   .where(eq(payment.id, paymentId))
   .for("update");

  if (!paymentRecord) return [null, APIError.notFound("Payment not found")];

  const [orderRecord] = await db
   .select()
   .from(order)
   .where(eq(order.id, paymentRecord.orderId))
   .for("update");

  if (!orderRecord) return [null, APIError.notFound("Order not found")];

  if (
   orderRecord.orderStatus === "failed" ||
   paymentRecord.status === "failed"
  ) {
   return [{ payment: paymentRecord, order: orderRecord }, null];
  }

  const [updatedPayment] = await db
   .update(payment)
   .set({
    status: "failed",
    updatedAt: new Date(),
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
   .where(eq(order.id, orderRecord.id))
   .returning();

  return [
   {
    payment: updatedPayment,
    order: updatedOrder,
   },
   null,
  ];
 }

 @Transactional()
 async verifyPayment(
  orderId: string,
  reference: string,
  paidAmount: number,
  paidAtDate: Date,
 ): Promise<Result<TPaymentVerificationResult>> {
  const [paymentRecord] = await db
   .select()
   .from(payment)
   .where(eq(payment.paymentReference, reference))
   .for("update");

  if (!paymentRecord) return [null, APIError.notFound("Payment not found")];

  if (paymentRecord.orderId !== orderId)
   return [
    null,
    APIError.badRequest("[Invalid Payment]: Payment is not for order"),
   ];

  if (paymentRecord.status === "paid" || paymentRecord.status === "failed") {
   return [{ payment: paymentRecord }, null];
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
   .where(
    and(
     eq(payment.orderId, paymentRecord.orderId),
     eq(payment.status, "initialized"),
    ),
   )
   .returning();

  const [updatedOrder] = await db
   .update(order)
   .set({
    paymentStatus: "paid",
    orderStatus: "fulfilled",
    updatedAt: new Date(),
   })
   .where(
    and(
     eq(order.id, paymentRecord.orderId),
     eq(order.orderStatus, "processing"),
    ),
   )
   .returning();

  runOnTransactionCommit(() => {
   publishEvent({
    event_type: EventType.PAYMENT_FULFILLED,
    payload: {
     userId: updatedOrder.userId,
     updatedPayment,
     updatedOrder,
    },
   });
  });

  return [{ payment: updatedPayment, order: updatedOrder }, null];
 }

 async handlePaystackPaymentVerified(
  eventData: ChargeEvent,
  orderId: string,
 ): Promise<Result<TPaymentVerificationResult>> {
  return await this.verifyPayment(
   orderId,
   eventData.reference,
   eventData.amount,
   eventData.paid_at,
  );
 }

 async handleStripePaymentVerified(
  eventData: ChargeEvent,
  orderId: string,
 ): Promise<Result<TPaymentVerificationResult>> {
  return await this.verifyPayment(
   orderId,
   eventData.reference,
   eventData.amount,
   eventData.paid_at,
  );
 }
}

export default new WebhookHandler();
