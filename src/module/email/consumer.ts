/** @format */
import logger from "@app/logger.ts";
import db from "@db/db.ts";
import MerchantService from "@module/merchant/merchant.service.ts";
import OrderService from "@module/order/order.service.ts";
import { user } from "@schema/auth.ts";
import { merchant } from "@schema/merchant.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";
import { and, eq, isNull } from "drizzle-orm";
import FA from "fasy";

import EmailWorker from "./email.worker.ts";

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  try {
   const { userId, orderId } = payload.payload;

   const [orderDetails, err] = await OrderService.getOrderWithUser(
    userId,
    orderId,
   );
   if (err || !orderDetails) throw err;

   const emailMessage = `Hi ${orderDetails.user.name}, your order #${orderId} is confirmed!`;

   await EmailWorker({
    user: orderDetails.user,
    message: emailMessage,
   });
  } catch (err) {
   logger.error({ err }, "[Background Event Error Intercepted]");
  }
 },
 error: (err) => {
  logger.error({ err });
 },
});

EventBus.on(EventType.CART_LOW_STOCK_ALERT).subscribe({
 next: async (payload) => {
  try {
   const { userId, productName, productId, quantity } = payload.payload;
   const [userDetails] = await db
    .select({
     name: user.name,
     email: user.email,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

   await EmailWorker({
    user: {
     id: userId,
     name: userDetails.name,
     email: userDetails.email,
    },
    message: `"${productName}" is running low (${quantity} left)`,
   });
  } catch (err) {
   logger.error({ err }, "[Notification Error]");
  }
 },
 error: (err) => {
  logger.error({ err });
 },
});

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  try {
   const { orderId, productIds } = payload.payload;

   await FA.concurrent.map(async (productId: string) => {
    const [merchantForProduct, err] =
     await MerchantService.getMerchantIdFromProductId(productId);
    if (err || !merchantForProduct) throw err;

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
     .where(
      and(eq(merchant.id, merchantForProduct.id), isNull(merchant.deletedAt)),
     );

    const emailMessage = `Hi ${userMerchant.user.name}, a purchase of #${orderId} has been made for your product`;

    await EmailWorker({
     user: userMerchant.user,
     message: emailMessage,
    });
   }, productIds);
  } catch (err) {
   logger.error({ err }, "[Background Event Error Intercepted]");
  }
 },
 error: (err) => {
  logger.error({ err });
 },
});
