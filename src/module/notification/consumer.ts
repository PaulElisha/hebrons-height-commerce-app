/** @format */
import logger from "@app/logger.ts";
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import { merchant } from "@schema/merchant.ts";
import {
 CartLowStockAlertPayload,
 EventBus,
 EventType,
 LowStockAlertPayload,
 OrderCancelledPayload,
 OrderPlacedPayload,
 OrderStatusUpdatedPayload,
} from "@shared/event-bus/index.ts";
import { and, eq, isNull } from "drizzle-orm";

import NotificationService from "./notification.service.ts";

EventBus.on(EventType.ORDER_STATUS_UPDATED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderStatusUpdatedPayload>(
   payload.outboxId,
   async ({ userId, orderId, status, message }) => {
    await NotificationService.createNotification(
     userId,
     `Order #${orderId.slice(0, 8)}`,
     message ?? `Your order is now ${status.replace("_", " ")}`,
     "order_update",
    );
   },
  );
 },
});

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderPlacedPayload>(
   payload.outboxId,
   async ({ userId, orderId }) => {
    await NotificationService.createNotification(
     userId,
     "Order Placed",
     `Your order #${orderId.slice(0, 8)} has been placed successfully`,
     "order_update",
    );
   },
  );
 },
});

EventBus.on(EventType.LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<LowStockAlertPayload>(
   payload.outboxId,
   async ({ merchantId, productName, quantity }) => {
    if (!merchantId) return logger.info("Merchant id not found");

    const [merchantData] = await db
     .select({ userId: merchant.userId })
     .from(merchant)
     .where(and(eq(merchant.id, merchantId), isNull(merchant.deletedAt)))
     .limit(1);

    if (!merchantData) return logger.info("Merchant data not found");

    await NotificationService.createNotification(
     merchantData.userId,
     "Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
     "stock_alert",
    );
   },
  );
 },
});

EventBus.on(EventType.CART_LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<CartLowStockAlertPayload>(
   payload.outboxId,
   async ({ userId, productName, quantity }) => {
    await NotificationService.createNotification(
     userId,
     "Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
     "stock_alert",
    );
   },
  );
 },
});

EventBus.on(EventType.ORDER_CANCELLED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderCancelledPayload>(
   payload.outboxId,
   async ({ userId, orderId }) => {
    const [orderDetails, err] = await OrderService.getOrderWithUser(
     userId,
     orderId,
    );

    if (err || !orderDetails) return logger.error(err);

    await NotificationService.createNotification(
     orderDetails.user.id,
     "Order Cancelled",
     `Your order #${orderId.slice(0, 8)} has been cancelled`,
     "order_update",
    );
   },
  );
 },
});
