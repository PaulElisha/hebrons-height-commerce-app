/** @format */
import { eq } from "drizzle-orm";
import Env from "env.ts";
import FA from "fasy";

import stripeClient from "@app/stripe.ts";
import db from "@db/db.ts";

import OrderService from "@module/order/order.service.ts";

import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import { EventType } from "@shared/event-bus/config.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";
import { Result, TOrderItems } from "@shared/types.ts";

import { product } from "@schema/product.ts";

import { CheckoutData, PaymentResponse } from "./payment.service.ts";
import z from "zod";
import AppError from "@shared/error/app-error.ts";
import InternalServerError from "@shared/error/internal-server.ts";
export const FetchRail: Record<string, (...any: any[]) => any> = {
 initializePaystackCheckout: async (
  userId: string,
  orderId: string,
  data: z.infer<typeof CheckoutData>,
 ): Promise<Result<z.infer<typeof PaymentResponse>, AppError>> => {
  const orderWithUser = await OrderService.getOrderWithUser(userId, orderId);

  const response = await fetch(Env.PAYSTACK_INIT_URL, {
   method: "POST",
   headers: {
    Authorization: `Bearer ${Env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
   },
   body: JSON.stringify({
    email: data.email,
    amount: Math.round(Number(orderWithUser.subtotal) * Env.SCALER),
    currency: data.currency,
    callback_url: data.callback_url,
    metadata: {
     name: orderWithUser.user.name,
     email: orderWithUser.user.email,
     orderId,
     ...data.metadata,
    },
   }),
  });

  if (!response.ok) {
   const errBody = await response.json().catch(() => ({}));

   return [
    null,
    new BadRequestException(
     errBody.message || "Paystack Payment failed",
     HttpStatus.BAD_REQUEST,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];
  }

  const responseData = await response.json();

  const res = {
   email: data.email,
   mode: data.mode,
   rail: data.rail,
   amount: Math.round(Number(orderWithUser.subtotal) * Env.SCALER),
   currency: data.currency,
   callbackUrl: data.callback_url,
   checkout_url: responseData.data?.authorization_url,
   reference: responseData.data?.reference,
   access_code: responseData.data?.access_code,
  };

  if (responseData?.data)
   PublishEvent({
    event_type: EventType.PAYSTACK_PAYMENT_INITIALIZED,
    payload: {
     paystackData: res,
     userId,
     orderId,
    },
   });

  return [res, null];
 },
 initializeStripeCheckout: async (
  userId: string,
  orderId: string,
  data: z.infer<typeof CheckoutData>,
 ): Promise<Result<z.infer<typeof PaymentResponse>, AppError>> => {
  const [orderData, e] = await OrderService.getOrderDetails(userId, orderId);

  if (e || !orderData) return [null, e];

  return await stripeClient.checkout.sessions
   .create({
    mode: data.mode,
    customer_email: data.email,
    line_items: await FA.concurrent.map(
     async (i: TOrderItems) => ({
      price_data: {
       currency: data.currency,
       product_data: {
        name: await db
         .select({ name: product.name })
         .from(product)
         .where(eq(product.id, i.productId))
         .then((res) => {
          return res[0].name;
         }),
       },
       unit_amount: Math.round(i.unitPrice * Env.SCALER),
      },
      quantity: i.quantity,
     }),
     orderData.order_items,
    ),
    metadata: data.metadata,
    success_url: `${Env.BASE_URL}/success`,
    cancel_url: `${Env.BASE_URL}/failed`,
   })
   .then(async (session) => {
    if (!session.url) {
     return [
      null,
      new InternalServerError(
       "Stripe payment failed",
       HttpStatus.INTERNAL_SERVER_ERROR,
       ErrorCode.INTERNAL_SERVER_ERROR,
      ),
     ];
    }

    const res = {
     email: data.email,
     mode: data.mode,
     rail: data.rail,
     currency: data.currency,
     callbackUrl: data.callback_url,
     checkout_url: session.url,
    };

    PublishEvent({
     event_type: EventType.STRIPE_PAYMENT_INITIALIZED,
     payload: {
      stripeData: res,
      userId,
      orderId,
     },
    });

    return [{ checkout_url: session.url }, null];
   });
 },
};
