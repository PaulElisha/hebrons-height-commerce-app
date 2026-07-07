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

export const FetchRail: Record<string, (...any: any[]) => any> = {
 initializePaystackCheckout: () => {},
 initializeStripeCheckout: async (
  userId: string,
  orderId: string,
  data: PaymentData,
 ) => {
  const orderData = await OrderService.getOrderDetails(userId, orderId);

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
    metadata: {
     orderId: orderData?.order?.id,
    },
    success_url: `${Env.BASE_URL}/success`,
    cancel_url: `${Env.BASE_URL}/failed`,
   })
   .then(async (session) => {
    if (session.url) {
     await db
      .update(order)
      .set({
       orderStatus: "processing",
       paymentStatus: "processing",
      })
      .where(eq(order.id, orderId));
    }

    return session.url;
   });
 },
};
