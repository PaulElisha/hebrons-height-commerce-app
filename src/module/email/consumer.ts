/** @format */
import db from "@db/db.ts";
import { formatErrorPayload } from "@error/format-error.ts";
import MerchantService from "@module/merchant/merchant.service.ts";
import OrderService from "@module/order/order.service.ts";
import { user } from "@schema/auth.ts";
import { merchant } from "@schema/merchant.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";
import { eq, inArray } from "drizzle-orm";
import FA from "fasy";

import EmailWorker from "./email.worker.ts";
import Env from "env.ts";
import { auth } from "@auth/auth.ts";

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  try {
   const { userId, orderId } = payload.payload;

   const [orderDetails, err] = await OrderService.getOrderWithUser(
    userId,
    orderId,
   );
   if (err || !orderDetails) throw err || new Error("Order not found");

   const emailMessage = `Hi ${orderDetails.user.name}, your order #${orderId} is confirmed!`;

   await EmailWorker({
    user: orderDetails.user,
    message: emailMessage,
   });
  } catch (err) {
   const formatted = formatErrorPayload(
    err instanceof Error ? err : new Error(String(err)),
   );
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (err) => {
  console.error(err);
 },
});

EventBus.on(EventType.LOW_STOCK_ALERT).subscribe({
 next: async (payload) => {
  try {
   const { userId, productName, productId, quantity } = payload.payload;

   const result = await auth.api.getSession({
    headers: {
     "Content-Type": "application/json",
    },
   });

   if (!result) throw Error;

   const response = await fetch(`${Env.BASE_URL}/api/user/profile`, {
    method: "GET",
    headers: {
     "Content-Type": "application/json",
     Authorization: `Bearer ${result.session.token}`,
    },
   });

   const data = await response.json();

   const validUser = data?.data[userId || "id"];

   await EmailWorker({
    user: {
     id: validUser.id,
     name: validUser.name,
     email: validUser.email,
    },
    message: `"${productName}" is running low (${quantity} left)`,
   });
   // await Promise.all([
   //  NotificationService.createNotification(
   //   merchantId,
   //   "Low Stock Alert",
   //   `"${productName}" is running low (${quantity} left)`,
   //   "stock_alert",
   //  ),
   //  WebPushService.sendPushNotification(
   //   merchantId,
   //   "Low Stock Alert",
   //   `"${productName}" is running low (${quantity} left)`,
   //  ),
   // ]);
  } catch (err) {
   const formatted = formatErrorPayload(
    err instanceof Error ? err : new Error(String(err)),
   );
   console.error("[Notification Error]:", formatted.body);
  }
 },
 error: (err) => {
  console.error(err);
 },
});

EventBus.on(EventType.ORDER_PLACED).subscribe({
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
    const formatted = formatErrorPayload(
     err instanceof Error ? err : new Error(String(err)),
    );
    console.error("[Background Event Error Intercepted]:", formatted.body);
   }
  },
  error: (err) => {
   console.error(err);
  },
 });

EventBus.on(EventType.CART_LOW_STOCK).subscribe({
  next: async (payload) => {
   try {
    const { productId, productName, quantity, userIds } = payload.payload;

    const users = await db
     .select({ id: user.id, name: user.name, email: user.email })
     .from(user)
     .where(inArray(user.id, userIds));

    await FA.concurrent.map(async (u: (typeof users)[number]) => {
     const emailMessage = `Hi ${u.name}, "${productName}" is almost sold out! Only ${quantity} left in stock. Order now before it's gone!`;

     await EmailWorker({
      user: u,
      message: emailMessage,
     });
    }, users);
   } catch (err) {
    const formatted = formatErrorPayload(
     err instanceof Error ? err : new Error(String(err)),
    );
    console.error("[Background Event Error Intercepted]:", formatted.body);
   }
  },
  error: (err) => {
   console.error(err);
  },
 });
