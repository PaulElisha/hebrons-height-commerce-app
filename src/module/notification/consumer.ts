/** @format */
import logger from "@app/logger.ts";
import OrderService from "@module/order/order.service.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import {
 EventBroker,
 EventType,
 LowStockAlertPayload,
 OrderCancelledPayload,
 OrderPlacedPayload,
 OrderStatusUpdatedPayload,
 PaymentFulfilledPayload,
} from "@shared/event-bus/index.ts";

import NotificationService from "./notification.service.ts";
import { notificationBroker } from "./broker.ts";
import FA from "fasy";

export function connectToUserEvents() {
 EventBroker.listen().subscribe({
  next: ({ payload, event_type }) => {
   const userId = payload.userId as string | undefined;
   if (!userId) return;

   if (payload.merchantUserIds && Array.isArray(payload.merchantUserIds)) {
    const merchantUserIds: string[] = payload.merchantUserIds;

    if (merchantUserIds.length > 0) {
     const { merchantUserIds: _, ...restPayload } = payload;

     merchantUserIds.forEach((uid) =>
      notificationBroker.publish(uid, restPayload, event_type),
     );
    }
   }

   const { merchantUserIds: _, ...ownerPayload } = payload;
   notificationBroker.publish(userId, ownerPayload, event_type);
  },
 });
}

EventBroker.subscribe(EventType.ORDER_STATUS_UPDATED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderStatusUpdatedPayload>(
   payload.outboxId,
   async ({ userId, orderId, status, message, merchantUserIds }) => {
    const safeMerchantIds = Array.isArray(merchantUserIds)
     ? merchantUserIds
     : [];
    const allUsers = [...new Set([...safeMerchantIds, userId])];

    await FA.concurrent.map(async (uid: string) => {
     await NotificationService.createNotification(
      uid,
      `Order #${orderId.slice(0, 8)}`,
      message ?? `Your order is now ${status.replaceAll("_", " ")}`,
      "order_update",
     );
    }, allUsers);
   },
  );
 },
});

EventBroker.subscribe(EventType.ORDER_PLACED).subscribe({
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

EventBroker.subscribe(EventType.MERCHANT_LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<LowStockAlertPayload>(
   payload.outboxId,
   async ({ userId, productName, quantity }) => {
    if (!userId) return logger.info("User id not found");

    await NotificationService.createNotification(
     userId,
     "Merchant Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
     "stock_alert",
    );
   },
  );
 },
});

EventBroker.subscribe(EventType.USERCART_LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<LowStockAlertPayload>(
   payload.outboxId,
   async ({ userId, productName, quantity }) => {
    await NotificationService.createNotification(
     userId,
     "Cart Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
     "stock_alert",
    );
   },
  );
 },
});

EventBroker.subscribe(EventType.ORDER_CANCELLED).subscribe({
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

EventBroker.subscribe(EventType.PAYMENT_FULFILLED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaymentFulfilledPayload>(
   payload.outboxId,
   async ({ updatedOrder }) => {
    if (!updatedOrder?.userId) return;

    await NotificationService.createNotification(
     updatedOrder.userId,
     "Payment Successful",
     `Payment received — order #${updatedOrder.id.slice(0, 8)} is now fulfilled`,
     "order_update",
    );
   },
  );
 },
});
