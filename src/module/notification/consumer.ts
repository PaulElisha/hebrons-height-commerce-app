/** @format */
import OrderService from "@module/order/order.service.ts";
import { formatErrorPayload } from "@shared/error/format-error.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";

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
   const { userId, orderId } = payload.payload;
   await NotificationService.createNotification(
    userId,
    "Order Placed",
    `Your order #${orderId.slice(0, 8)} has been placed successfully`,
    "order_update",
   );
  } catch (e) {
   const formatted = formatErrorPayload(
    e instanceof Error ? e : new Error(String(e)),
   );
   console.error("[Notification Error]:", formatted.body);
  }
 },
 error: (err) => {
  console.error(err);
 },
});

EventBus.on(EventType.LOW_STOCK_ALERT).subscribe({
 next: async (payload) => {
  try {
   const { merchantId, productName, productId, quantity } = payload.payload;
   await Promise.all([
    NotificationService.createNotification(
     merchantId,
     "Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
     "stock_alert",
    ),
    WebPushService.sendPushNotification(
     merchantId,
     "Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
    ),
   ]);
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
