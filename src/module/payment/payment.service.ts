/** @format */
import { eq, and, or } from "drizzle-orm";
import db from "@db/db.ts";
import { payment } from "@schema/payment.ts";
import { order } from "@schema/order.ts";
import OrderService from "@module/order/order.service.ts";
import { TOrderItems } from "@shared/types.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import HttpStatus from "@shared/enum/http.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import stripeClient from "@app/stripe.ts";
import Stripe from "stripe";
import ProductService from "@module/product/product.service.ts";
import FA from "fasy";
import Env from "env.ts";
import CartService from "@module/cart/cart.service.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import { FetchRail } from "./dispatcher.ts";

export interface CheckoutData {
 email: string;
 amount: number;
 currency: string;
 rail: string;
 channels?: Array<string>;
 mode?: Stripe.Checkout.SessionCreateParams.Mode;
}

class PaymentService {
 initialize = async (
  userId: string,
  orderId: string,
  paymentData: CheckoutData,
 ) => {
  const data = await OrderService.getOrderDetails(userId, orderId);

  if (
   data.order.orderStatus !== "pending" &&
   data.order.paymentStatus !== "pending"
  ) {
   throw new BadRequestException(
    "Invalid order",
    HttpStatus.UNPROCESSABLE_ENTITY,
    ErrorCode.AUTH_INVALID_TOKEN,
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
    userId: userId,
    mode: paymentData.mode,
    rail: paymentData.rail,
    amount: paymentData.amount,
    currency: paymentData.currency,
    attempts: 2,
    channels: paymentData.channels,
   })
   .returning();

  return paymentCreated;
 };

 fetchPaymentForOrderByRail = async (
  userId: string,
  orderId: string,
  checkoutData: CheckoutData,
 ) => {
  const [paymentData] = await db
   .select()
   .from(payment)
   .where(and(eq(payment.orderId, orderId)));

  const rail = checkoutData.rail;

  if (!paymentData || paymentData.rail !== rail) {
   throw new InternalServerError(
    "Invalid payment rail",
    HttpStatus.NOT_FOUND,
    ErrorCode.RESOURCE_NOT_FOUND,
   );
  }

  const callback = FetchRail[rail];
  let url;

  if (typeof rail === "string" && rail == "initializePaystackCheckout") {
   await callback(userId, orderId, checkoutData);
  } else if (typeof rail === "string" && rail == "initializeStripeCheckout") {
   url = await callback(userId, orderId, checkoutData);
  }

  return url;
 };
}

export default new PaymentService();
