/** @format */
import db from "@db/db.ts";
import { formatErrorPayload } from "@error/format-error.ts";
import MerchantService from "@module/merchant/merchant.service.ts";
import OrderService from "@module/order/order.service.ts";
import { user } from "@schema/auth.ts";
import { merchant } from "@schema/merchant.ts";
import { EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";
import { eq } from "drizzle-orm";
import FA from "fasy";

import EmailWorker from "./email.worker.ts";

onEvent(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  try {
   const { userId, orderId } = payload.payload;

    const [orderDetails, err] = await OrderService.getOrderWithUser(userId, orderId);
    if (err || !orderDetails) throw err || new Error("Order not found");

    const emailMessage = `Hi ${orderDetails.user.name}, your order #${orderId} is confirmed!`;

    await EmailWorker({
     user: orderDetails.user,
     message: emailMessage,
    });
   } catch (err) {
    const formatted = formatErrorPayload(err instanceof Error ? err : new Error(String(err)));
    console.error("[Background Event Error Intercepted]:", formatted.body);
   }
  },
  error: (err) => {
   console.error(err);
  },
 });

onEvent(EventType.ORDER_PLACED).subscribe({
  next: async (payload) => {
   try {
    const { orderId, productIds } = payload.payload;

   await FA.concurrent.map(async (productId: string) => {
    const merchantForProduct =
     await MerchantService.getMerchantIdFromProductId(productId);

    const [userMerchant] = await db
     .select({
      businessName: merchant.businessName,
      user: {
       id: user.id,
       email: user.email,
       name: user.name,
      },
     })
     .from(merchant)
     .innerJoin(user, eq(merchant.userId, user.id))
     .where(eq(merchant.id, merchantForProduct.id));

    const emailMessage = `Hi ${userMerchant.user.name}, a purchase of #${orderId} has been made for your product`;

    await EmailWorker({
     user: userMerchant.user,
     message: emailMessage,
    });
   }, productIds);
   } catch (err) {
    const formatted = formatErrorPayload(err instanceof Error ? err : new Error(String(err)));
    console.error("[Background Event Error Intercepted]:", formatted.body);
   }
  },
  error: (err) => {
   console.error(err);
  },
 });
