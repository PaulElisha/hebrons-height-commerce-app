/** @format */
import stripeClient from "@app/stripe.ts";
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { product } from "@schema/product.ts";
import AppError from "@shared/error/app-error.ts";
import * as APIError from "@shared/error/APIError.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";
import { Result, TOrderItems } from "@shared/types.ts";
import { eq } from "drizzle-orm";
import Env from "env.ts";
import FA from "fasy";
import z from "zod";

import { CheckoutData, PaymentResponse } from "./payment.service.ts";

export const FetchRail: Record<string, (...any: any[]) => any> = {
 initializePaystackCheckout: async (
  userId: string,
  orderId: string,
  data: z.infer<typeof CheckoutData>,
 ): Promise<Result<z.infer<typeof PaymentResponse>, AppError>> => {
  const [orderWithUser, err] = await OrderService.getOrderWithUser(
   userId,
   orderId,
  );
  if (err || !orderWithUser) return [null, err];

  const baseAmount = Math.round(Number(orderWithUser.subtotal) * Env.SCALER);
  const subCharge = Math.round((baseAmount * 15) / 10000) + 100 * Env.SCALER; // 0.15% + 100 NGN
  const totalAmount = baseAmount + subCharge;

  const response = await fetch(Env.PAYSTACK_INIT_URL, {
   method: "POST",
   headers: {
    Authorization: `Bearer ${Env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
   },
   body: JSON.stringify({
    email: data.email,
    amount: totalAmount,
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
    APIError.badRequest(errBody.message || "Paystack Payment failed"),
   ];
  }

  const responseData = await response.json();

  const res = {
   email: data.email,
   mode: data.mode,
   rail: data.rail,
   amount: totalAmount,
   currency: data.currency,
   callbackUrl: data.callback_url,
   checkout_url: responseData.data?.authorization_url,
   reference: responseData.data?.reference,
   access_code: responseData.data?.access_code,
  };

  if (responseData?.data)
   EventBus.publish({
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
  const [orderData, err] = await OrderService.getOrderDetails(userId, orderId);

  if (err || !orderData) return [null, err];

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
          if (res.length === 0)
           return [null, APIError.internalServer("Unknown product")];
          return res[0].name;
         }),
       },
       unit_amount: Math.round(i.unitPrice * Env.SCALER),
      },
      quantity: i.quantity,
     }),
     orderData.order_items,
    ),
    metadata: {
     orderId,
     ...data.metadata,
    },
    success_url: `${Env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Env.BASE_URL}/cancel`,
   })
   .then(async (session) => {
    if (!session.url) {
     return [null, APIError.internalServer("Stripe payment failed")];
    }

    const res = {
     email: data.email,
     mode: data.mode,
     rail: data.rail,
     currency: data.currency,
     callbackUrl: data.callback_url,
     checkout_url: session.url,
     reference: session.id,
    };

    EventBus.publish({
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
