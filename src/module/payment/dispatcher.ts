/** @format */

import stripeClient from "@app/stripe.ts";
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { order } from "@schema/order.ts";
import { product } from "@schema/product.ts";
import { TOrderItems } from "@shared/types.ts";
import { eq } from "drizzle-orm";
import Env from "env.ts";
import FA from "fasy";

import { PaymentData } from "./payment.service.ts";
import CartService from "@module/cart/cart.service.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import HttpStatus from "@shared/enum/http.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";
import { EventType } from "@shared/event-bus/config.ts";

export const FetchRail: Record<string, (...any: any[]) => any> = {
 initializePaystackCheckout: async (
  userId: string,
  orderId: string,
  data: PaymentData,
 ) => {
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
     ...data.metadata,
    },
   }),
  });

  if (!response.ok) {
   const errBody = await response.json().catch(() => ({}));

   return [
    null,
    new BadRequestException(
     errBody.message || "Payment Initialization error",
     HttpStatus.BAD_REQUEST,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];
  }

  const responseData = await response.json();

  if (responseData.data.authorization_url)
   PublishEvent({
    event_type: EventType.PAYMENT_INITIALIZED,
    payload: {
     ...responseData.data.data,
     orderId,
     provider: "paystack",
    },
   });

  return [responseData.data, null];
 },
 initializeStripeCheckout: async (
  userId: string,
  orderId: string,
  data: PaymentData,
 ) => {
  const [orderData, e] = await OrderService.getOrderDetails(userId, orderId);

  if (orderData == null) return [null, e];

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
    if (session.url) {
     PublishEvent({
      event_type: EventType.PAYMENT_INITIALIZED,
      payload: {
       checkoutUrl: session.url,
       orderId,
       provider: "stripe",
      },
     });
    }

    return [session.url, null];
   });
 },
};
