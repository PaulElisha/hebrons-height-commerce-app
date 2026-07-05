/** @format */
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { payment } from "@schema/payment.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import { and, eq } from "drizzle-orm";
import Stripe from "stripe";

import { FetchRail } from "./dispatcher.ts";

export interface CheckoutData {
 email: string;
 amount: number;
 currency: string;
 rail: string;
 channels?: Array<string>;
 mode?: Stripe.Checkout.SessionCreateParams.Mode;
}

export interface PaymentData {
 email: string;
 currency: string;
 rail: string;
 mode?: Stripe.Checkout.SessionCreateParams.Mode;
}

class PaymentService {
 initialize = async (
  userId: string,
  orderId: string,
  checkoutData: CheckoutData,
 ) => {
  const data = await OrderService.getOrderDetails(userId, orderId);

  if (
   data.order.orderStatus !== "pending" &&
   data.order.paymentStatus !== "pending"
  ) {
   throw new BadRequestException(
    "Invalid order",
    HttpStatus.UNPROCESSABLE_ENTITY,
    ErrorCode.VALIDATION_ERROR,
   );
  }

  const [paymentExists] = await db
   .select()
   .from(payment)
   .where(and(eq(payment.orderId, orderId)));

  if (paymentExists) {
   throw new BadRequestException(
    "Payment already created",
    HttpStatus.CONFLICT,
    ErrorCode.VALIDATION_ERROR,
   );
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
    currency: checkoutData.currency,
    attempts: 2,
    channels: checkoutData.channels,
   })
   .returning();

  return paymentCreated;
 };

 fetchPaymentForOrderByRail = async (
  userId: string,
  orderId: string,
  paymentData: PaymentData,
 ) => {
  const [paymentExists] = await db
   .select()
   .from(payment)
   .where(and(eq(payment.orderId, orderId)));

  const rail = paymentData.rail;

  if (!paymentExists || paymentData.rail !== rail) {
   throw new InternalServerError(
    "Invalid payment rail",
    HttpStatus.NOT_FOUND,
    ErrorCode.RESOURCE_NOT_FOUND,
   );
  }

  const callback = FetchRail[rail];
  let url;

  if (typeof rail === "string" && rail == "initializePaystackCheckout") {
   await callback(userId, orderId, paymentData);
  } else if (typeof rail === "string" && rail == "initializeStripeCheckout") {
   url = await callback(userId, orderId, paymentData);
  }

  return url;
 };
}

export default new PaymentService();
