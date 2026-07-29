/** @format */
import logger from "@app/logger.ts";
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { merchant } from "@schema/merchant.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";
import { and, eq, isNull } from "drizzle-orm";

import WebPushService from "../webpush/webpush.service.ts";
import NotificationService from "./notification.service.ts";

EventBus.on(EventType.ORDER_STATUS_UPDATED).subscribe({
 next: async (payload) => {
  try {
   const { userId, orderId, status, message } = payload.payload;
   await NotificationService.createNotification(
    userId,
    `Order #${orderId.slice(0, 8)}`,
    message ?? `Your order is now ${status.replace("_", " ")}`,
    "order_update",
   );
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
   const { userId, orderId } = payload.payload;
   await NotificationService.createNotification(
    userId,
    "Order Placed",
    `Your order #${orderId.slice(0, 8)} has been placed successfully`,
    "order_update",
   );
  } catch (e) {
   logger.error({ err: e }, "[Notification Error]");
  }
 },
 error: (err) => {
  logger.error({ err });
 },
});

EventBus.on(EventType.LOW_STOCK_ALERT).subscribe({
 next: async (payload) => {
  try {
   const { merchantId, productName, productId, quantity } = payload.payload;
   const [merchantData] = await db
    .select({ userId: merchant.userId })
    .from(merchant)
    .where(and(eq(merchant.id, merchantId), isNull(merchant.deletedAt)))
    .limit(1);
   if (!merchantData) return;

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
  } catch (err) {
   logger.error({ err }, "[Notification Error]");
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
  } catch (err) {
   logger.error({ err }, "[Notification Error]");
  }
 },
 error: (err) => {
  logger.error({ err });
 },
});

EventBus.on(EventType.ORDER_CANCELLED).subscribe({
 next: async (payload) => {
  try {
   const { orderId } = payload.payload;

   const [orderDetails, err] = await OrderService.getOrderWithUser(
    payload.payload.userId,
    orderId,
   );
   if (err || !orderDetails) return;

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
  } catch (err) {
   logger.error({ err }, "[Notification Error]");
  }
 },
 error: (err) => {
  logger.error({ err });
 },
});
