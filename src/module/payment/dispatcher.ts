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
import { CheckoutData } from "./payment.service.ts";
import FA from "fasy";
import Env from "env.ts";
import CartService from "@module/cart/cart.service.ts";
import InternalServerError from "@shared/error/internal-server.ts";

export const FetchRail: Record<string, (...any: any[]) => any> = {
 initializePaystackCheckout: () => {},
 initializeStripeCheckout: async (
  userId: string,
  orderId: string,
  checkoutData: CheckoutData,
 ) => {
  const orderData = await OrderService.getOrderDetails(userId, orderId);

  return await stripeClient.checkout.sessions
   .create({
    mode: checkoutData.mode,
    customer_email: checkoutData.email,
    line_items: await FA.concurrent.map(
     async (i: TOrderItems) => ({
      price_data: {
       currency: checkoutData.currency,
       product_data: {
        name: `Product ${i.productId}`,
       },
       unit_amount: Math.round(i.unitPrice * Env.SCALER),
      },
      quantity: i.quantity,
     }),
     orderData.order_items,
    ),
    metadata: {
     orderId: orderData.order.id,
    },
    success_url: `${Env.BASE_URL}/success?orderId=${orderData.order.id}`,
    cancel_url: `${Env.BASE_URL}/failed/${orderData.order.id}?error=true`,
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

    return { url: session.url };
   });
 },
};
