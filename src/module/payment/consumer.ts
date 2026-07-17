/** @format */
import db from "@db/db.ts";
import { formatErrorPayload } from "@error/format-error.ts";
import { cartItem } from "@schema/cart.ts";
import { order } from "@schema/order.ts";
import { payment } from "@schema/payment.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import NotFoundException from "@shared/error/not-found.ts";
import { EventContract, EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";
import { Transaction } from "@shared/types.ts";
import { and, eq } from "drizzle-orm";
import Env from "env.ts";

import PaymentService from "./payment.service.ts";

onEvent<EventContract>(EventType.PAYSTACK_PAYMENT_INITIALIZED).subscribe({
 next: async (payload) => {
  try {
   const { paystackData, userId, orderId } = payload.payload;
   console.log("[...Paystack Initialization completed]:", { paystackData });

   const [paymentData] = await PaymentService.createPayment(userId, orderId, {
    ...paystackData,
    paymentProvider: "paystack",
   });

   console.log("[...Paystack record created]:", { paymentData });

   if (!paymentData) {
    throw new InternalServerError(
     "Payment record failed",
     HttpStatus.INTERNAL_SERVER_ERROR,
     ErrorCode.INTERNAL_SERVER_ERROR,
    );
   }

   const [updatedOrder] = await db
    .update(order)
    .set({
     orderStatus: "processing",
     paymentStatus: "processing",
     updatedAt: new Date(Date.now()),
    })
    .where(eq(order.id, orderId))
    .returning();

   console.log("[...Order record updated]:", { updatedOrder });
  } catch (error) {
   const formatted = formatErrorPayload(error as Error);
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (error) => {
  console.error(error);
 },
});

onEvent<EventContract>(EventType.PAYSTACK_PAYMENT_VERIFIED).subscribe({
 next: async (payload) => {
  const { orderId, event } = payload.payload;
  console.log("[...Paystack verification started]:", { event });

  try {
   return await db.transaction(async (tx: Transaction) => {
    const [paymentRecord] = await tx
     .select()
     .from(payment)
     .where(eq(payment.paymentReference, event.data.reference))
     .for("update");

    if (!paymentRecord) {
     throw new NotFoundException(
      "Payment not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.RESOURCE_NOT_FOUND,
     );
    }

    if (paymentRecord.status === "paid" || paymentRecord.status === "failed") {
     return { handled: true, payment: paymentRecord };
    }

    if (event.event === "charge.failed") {
     const [updatedPayment] = await tx
      .update(payment)
      .set({
       status: "failed",
       updatedAt: new Date(),
       attempts: 1,
      })
      .where(
       and(
        eq(payment.id, paymentRecord.id),
        eq(orderId, paymentRecord.orderId),
       ),
      )
      .returning();

     const [updatedOrder] = await tx
      .update(order)
      .set({
       orderStatus: "failed",
       paymentStatus: "failed",
       updatedAt: new Date(),
      })
      .where(eq(orderId, paymentRecord.orderId))
      .returning();

     return { handled: true, payment: updatedPayment, updatedOrder };
    }

    const paidAmount = Number(event.data?.amount) / Env.SCALER;
    const recordedAmount = Number(paymentRecord.amount) / Env.SCALER;

    if (paidAmount !== recordedAmount) {
     throw new BadRequestException(
      "Payment amount mismatch",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
     );
    }

    const paidAtDate = event.data?.paid_at
     ? new Date(event.data.paid_at)
     : new Date();

    const [updatedPayment] = await tx
     .update(payment)
     .set({
      status: "paid",
      paidAt: paidAtDate,
      updatedAt: new Date(),
     })
     .where(and(eq(orderId, paymentRecord.orderId)))
     .returning();

    const [updatedOrder] = await tx
     .update(order)
     .set({
      paymentStatus: "paid",
      orderStatus: "fulfilled",
      updatedAt: new Date(),
     })
     .where(eq(orderId, paymentRecord.orderId))
     .returning();

    // clear cart items

    await tx.delete(cartItem).where(eq(cartItem.userId, paymentRecord.userId));

    console.log("[...Paystack verification completed]:", { event });

    return { handled: true, payment: updatedPayment, order: updatedOrder };
   });
  } catch (error) {
   const formatted = formatErrorPayload(error as Error);
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (error) => {
  console.error(error);
 },
});

onEvent<EventContract>(EventType.STRIPE_PAYMENT_INITIALIZED).subscribe({
 next: async (payload) => {
  try {
   const { stripeData, userId, orderId } = payload.payload;
   console.log("[...Stripe Initialization completed]:", { stripeData });

   const [paymentData] = await PaymentService.createPayment(userId, orderId, {
    ...stripeData,
    paymentProvider: "stripe",
   });

   console.log("[...Paystack record created]:", { paymentData });

   if (!paymentData) {
    throw new InternalServerError(
     "Payment record failed",
     HttpStatus.INTERNAL_SERVER_ERROR,
     ErrorCode.INTERNAL_SERVER_ERROR,
    );
   }

   const [updatedOrder] = await db
    .update(order)
    .set({
     orderStatus: "processing",
     paymentStatus: "processing",
     updatedAt: new Date(Date.now()),
    })
    .where(eq(order.id, orderId))
    .returning();

   console.log("[...Order record updated]:", { updatedOrder });
  } catch (error) {
   const formatted = formatErrorPayload(error as Error);
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (error) => {
  console.error(error);
 },
});

onEvent<EventContract>(EventType.STRIPE_PAYMENT_VERIFIED).subscribe({
 next: async (payload) => {
  const { event: session, eventType } = payload.payload;
  console.log("[...Stripe verification started]:", { session });

  try {
   return await db.transaction(async (tx: Transaction) => {
    const [paymentRecord] = await tx
     .select()
     .from(payment)
     .where(eq(payment.paymentReference, session.id))
     .for("update");

    if (!paymentRecord) {
     throw new NotFoundException(
      "Payment not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.RESOURCE_NOT_FOUND,
     );
    }

    if (paymentRecord.status === "paid" || paymentRecord.status === "failed") {
     return { handled: true, payment: paymentRecord };
    }

    if (eventType === "checkout.session.expired") {
     const [updatedPayment] = await tx
      .update(payment)
      .set({
       status: "failed",
       updatedAt: new Date(),
       attempts: 1,
      })
      .where(
       and(
        eq(payment.id, paymentRecord.id),
        eq(payment.orderId, paymentRecord.orderId),
       ),
      )
      .returning();

     const [updatedOrder] = await tx
      .update(order)
      .set({
       orderStatus: "failed",
       paymentStatus: "failed",
       updatedAt: new Date(),
      })
      .where(eq(order.id, paymentRecord.orderId))
      .returning();

     return { handled: true, payment: updatedPayment, updatedOrder };
    }

    const paidAmount = Number(session.amount_total) / Env.SCALER;
    const recordedAmount = Number(paymentRecord.amount) / Env.SCALER;

    if (paidAmount !== recordedAmount) {
     throw new BadRequestException(
      "Payment amount mismatch",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
     );
    }

    const paidAtDate = session.payment_intent?.created
     ? new Date(session.payment_intent.created * 1000)
     : new Date();

    const [updatedPayment] = await tx
     .update(payment)
     .set({
      status: "paid",
      paidAt: paidAtDate,
      updatedAt: new Date(),
     })
     .where(eq(payment.orderId, paymentRecord.orderId))
     .returning();

    const [updatedOrder] = await tx
     .update(order)
     .set({
      paymentStatus: "paid",
      orderStatus: "fulfilled",
      updatedAt: new Date(),
     })
     .where(eq(order.id, paymentRecord.orderId))
     .returning();

    await tx.delete(cartItem).where(eq(cartItem.userId, paymentRecord.userId));

    console.log("[...Stripe verification completed]:", { session });

    return { handled: true, payment: updatedPayment, order: updatedOrder };
   });
  } catch (error) {
   const formatted = formatErrorPayload(error as Error);
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (error) => {
  console.error(error);
 },
});
