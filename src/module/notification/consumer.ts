/** @format */
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import { merchant } from "@schema/merchant.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";
import { and, eq, isNull } from "drizzle-orm";

import WebPushService from "../webpush/webpush.service.ts";
import NotificationService from "./notification.service.ts";
import logger from "@app/logger.ts";

EventBus.on(EventType.ORDER_STATUS_UPDATED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { userId, orderId, status, message } = p as {
    userId: string;
    orderId: string;
    status: string;
    message?: string;
   };

   await NotificationService.createNotification(
    userId,
    `Order #${orderId.slice(0, 8)}`,
    message ?? `Your order is now ${status.replace("_", " ")}`,
    "order_update",
   );
  });
 },
});

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { userId, orderId } = p as { userId: string; orderId: string };

   await NotificationService.createNotification(
    userId,
    "Order Placed",
    `Your order #${orderId.slice(0, 8)} has been placed successfully`,
    "order_update",
   );
  });
 },
});

EventBus.on(EventType.LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { merchantId, productName, quantity } = p as {
    merchantId: string;
    productName: string;
    quantity: number;
   };

   const [merchantData] = await db
    .select({ userId: merchant.userId })
    .from(merchant)
    .where(and(eq(merchant.id, merchantId), isNull(merchant.deletedAt)))
    .limit(1);

   if (!merchantData) return logger.info("Merchant data not found");

   await Promise.all([
    NotificationService.createNotification(
     merchantData.userId,
     "Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
     "stock_alert",
    ),
    WebPushService.sendPushNotification(
     merchantData.userId,
     "Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
    ),
   ]);
  });
 },
});

EventBus.on(EventType.CART_LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { userId, productName, quantity } = p as {
    userId: string;
    productName: string;
    quantity: number;
   };

   await Promise.all([
    NotificationService.createNotification(
     userId,
     "Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
     "stock_alert",
    ),
    WebPushService.sendPushNotification(
     userId,
     "Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
    ),
   ]);
  });
 },
});

EventBus.on(EventType.ORDER_CANCELLED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { userId, orderId } = p as { userId: string; orderId: string };

   const [orderDetails, err] = await OrderService.getOrderWithUser(
    userId,
    orderId,
   );

   if (err || !orderDetails) return logger.error(err);

   await Promise.all([
    NotificationService.createNotification(
     orderDetails.user.id,
     "Order Cancelled",
     `Your order #${orderId.slice(0, 8)} has been cancelled`,
     "order_update",
    ),
    WebPushService.sendPushNotification(
     orderDetails.user.id,
     "Order Cancelled",
     `Your order #${orderId.slice(0, 8)} has been cancelled`,
    ),
   ]);
  });
 },
});
