/** @format */
import Env from "@/env.ts";
// import logger from "@app/logger.ts"; // Paystack only
// import stripeClient from "@app/stripe.ts"; // Stripe only
import bachsClient from "@app/bachs.ts";
import type { PaymentMethodCorridor } from "@bachs/sdk";
import db from "@db/db.ts";
import { order } from "@db/schema/order.ts";
import { payment } from "@db/schema/payment.ts";
// import { product } from "@db/schema/product.ts"; // Stripe only
import OrderService from "@module/order/order.service.ts";
import * as APIError from "@shared/error/APIError.ts";
import asError from "@shared/error/as-error.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { Result } from "@shared/types.ts";
// import { TOrderItems } from "@shared/types.ts"; // Stripe only
import { eq } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
// import FA from "fasy"; // Stripe only
// import Stripe from "stripe"; // Stripe only
import z from "zod";

import { CheckoutData, PaymentResponseData } from "./payment.service.ts";

type Rail = z.infer<typeof CheckoutData>["rail"];

type RailHandler = (
 userId: string,
 orderId: string,
 data: z.infer<typeof CheckoutData>,
) => Promise<Result<PaymentResponseData>>;

const BACHS_MOBILE_MONEY_CORRIDORS: PaymentMethodCorridor[] = [
 "MOMO_GHS",
 "MOMO_KES",
 "MOMO_TZS",
 "MOMO_UGX",
 "MOMO_XAF",
 "MOMO_XOF",
 "MOMO_RWF",
 "MOMO_MWK",
 "MOMO_ZMW",
];

const bachsPaymentMethods = (
 rail: Rail,
): PaymentMethodCorridor[] | undefined => {
 switch (rail) {
  case "initializeBachsCardCheckout":
   return ["USD_CARD", "NGN_CARD"];
  case "initializeBachsBankTransferCheckout":
   return ["NGN_BANK_TRANSFER"];
  case "initializeBachsMobileMoneyCheckout":
   return BACHS_MOBILE_MONEY_CORRIDORS;
  case "initializeBachsCryptoCheckout":
   return ["CRYPTO"];
  default:
   return undefined;
 }
};

const reusableBachsPayment = async (
 orderId: string,
 fallback: { amount: number; currency: string },
): Promise<PaymentResponseData | null> => {
 const [existing] = await db
  .select()
  .from(payment)
  .where(eq(payment.orderId, orderId))
  .limit(1);

 if (
  !existing ||
  existing.status !== "initialized" ||
  !existing.paymentReference ||
  !existing.authorizationUrl
 )
  return null;

 try {
  const session = await bachsClient.checkoutSessions.get(
   existing.paymentReference,
  );

  const isTerminal = ["completed", "expired", "cancelled"].includes(
   session.status,
  );

  const isExpired =
   !!session.expires_at &&
   new Date(session.expires_at).getTime() <= Date.now();

  if (isTerminal || isExpired) return null;

  return {
   email: existing.email,
   mode: (existing.mode ?? undefined) as PaymentResponseData["mode"],
   rail: existing.rail as Rail,
   amount: Number(existing.amount ?? fallback.amount),
   currency: existing.currency ?? fallback.currency,
   callbackUrl: existing.callbackUrl ?? undefined,
   checkout_url: existing.authorizationUrl,
   reference: existing.paymentReference,
   paymentProvider: existing.paymentProvider ?? "bachs",
  };
 } catch {
  return null;
 }
};

const initializeBachsCheckout: RailHandler = async (userId, orderId, data) => {
 try {
  const [orderData, err] = await OrderService.getOrderWithUser(userId, orderId);

  if (err || !orderData) return [null, err];

  const amount = Number(orderData.subtotal);
  const currency = data.currency.toUpperCase();

  const reusable = await reusableBachsPayment(orderId, { amount, currency });

  if (reusable) return [reusable, null];

  const paymentMethods = bachsPaymentMethods(data.rail);

  const metadata = Object.fromEntries(
   Object.entries({ orderId, ...data.metadata }).map(([key, value]) => [
    key,
    String(value),
   ]),
  );

  const session = await bachsClient.checkoutSessions.create(
   {
    pricing: {
     currency,
     amount: amount.toFixed(2),
    },
    ...(paymentMethods !== undefined && {
     payment_method_types: paymentMethods,
    }),
    customer: { email: data.email, name: orderData.user.name },
    metadata,
    success_url: `${Env.BASE_URL}/api/payment/success`,
    cancel_url: `${Env.BASE_URL}/api/payment/cancel`,
   },
   { idempotencyKey: `bachs-${orderId}` },
  );

  if (!session.checkout_url) {
   return [null, APIError.badRequest("Bachs Payment failed")];
  }

  const res: PaymentResponseData = {
   email: data.email,
   mode: data.mode,
   rail: data.rail,
   amount: Number(amount),
   currency,
   callbackUrl: data.callback_url,
   checkout_url: session.checkout_url,
   reference: session.checkout_id,
   paymentProvider: "bachs",
  };

  await publishEvent({
   event_type: EventType.PAYMENT_INITIALIZED,
   payload: {
    userId,
    orderId,
    paymentResponseData: res,
   },
  });

  return [res, null];
 } catch (err) {
  return [null, asError(err)];
 }
};

export const FetchRail: Record<Rail, RailHandler> = {
 /*
 initializePaystackCheckout: async (
  userId: string,
  orderId: string,
  data: z.infer<typeof CheckoutData>,
 ): Promise<Result<PaymentResponseData>> => {
  try {
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
    const errBody = await response.json().catch((e: Error) => {
     logger.error({ err: String(e.message) }, "[...Paystack error body]");
     return { message: String(e.message) };
    });
    return [null, APIError.badRequest(errBody.message)];
   }

   const responseData = await response.json();

   const res: PaymentResponseData = {
    email: data.email,
    mode: data.mode,
    rail: data.rail,
    amount: totalAmount,
    currency: data.currency,
    callbackUrl: data.callback_url,
    checkout_url: responseData.data?.authorization_url,
    reference: responseData.data?.reference,
    access_code: responseData.data?.access_code,
    paymentProvider: "paystack",
   };

   if (responseData?.data) {
    await publishEvent({
     event_type: EventType.PAYMENT_INITIALIZED,
     payload: {
      userId,
      orderId,
      paymentResponseData: res,
     },
    });
   }

   return [res, null];
  } catch (err) {
   return [null, asError(err)];
  }
 },
 initializeStripeCheckout: async (
  userId: string,
  orderId: string,
  data: z.infer<typeof CheckoutData>,
 ): Promise<Result<PaymentResponseData>> => {
  try {
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
          .then((res) => res[0]?.name),
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
    .then(async (session: Stripe.Checkout.Session) => {
     if (!session.url) {
      return [null, APIError.badRequest("Stripe Payment failed")];
     }

     const res: PaymentResponseData = {
      email: data.email,
      mode: data.mode,
      rail: data.rail,
      amount: Math.round(Number(orderData.order.subtotal) * Env.SCALER),
      currency: data.currency,
      callbackUrl: data.callback_url,
      checkout_url: session.url,
      reference: session.id,
      paymentProvider: "stripe",
     };

     await publishEvent({
      event_type: EventType.PAYMENT_INITIALIZED,
      payload: {
       userId,
       orderId,
       paymentResponseData: res,
      },
     });

     return [res, null];
    });
  } catch (err) {
   return [null, asError(err)];
  }
 },
 */
 initializeBachsCheckout,
 initializeBachsCardCheckout: initializeBachsCheckout,
 initializeBachsBankTransferCheckout: initializeBachsCheckout,
 initializeBachsMobileMoneyCheckout: initializeBachsCheckout,
 initializeBachsCryptoCheckout: initializeBachsCheckout,
};
