/** @format */
import logger from "@app/logger.ts";
import OrderService from "@module/order/order.service.ts";
import {
 EventBroker,
 EventType,
 LowStockAlertPayload,
 OrderCancelledPayload,
 OrderPlacedPayload,
 OrderStatusUpdatedPayload,
 PaymentFailedPayload,
 PaymentFulfilledPayload,
 PaymentInitializedPayload,
} from "@shared/event-bus/index.ts";
import { consumeOutboxEvent } from "@shared/util/outbox-consumer.ts";
import FA from "fasy";

import NotificationService from "./notification.service.ts";

EventBroker.subscribe(EventType.ORDER_STATUS_UPDATED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderStatusUpdatedPayload>(
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
   payload.outboxId,
  );
 },
});

EventBroker.subscribe(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderPlacedPayload>(async ({ userId, orderId }) => {
   await NotificationService.createNotification(
    userId,
    "Order Placed",
    `Your order #${orderId.slice(0, 8)} has been placed successfully`,
    "order_update",
   );
  }, payload.outboxId);
 },
});

EventBroker.subscribe(EventType.MERCHANT_LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<LowStockAlertPayload>(
   async ({ userId, productName, quantity }) => {
    if (!userId) return logger.info("User id not found");

    await NotificationService.createNotification(
     userId,
     "Merchant Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
     "stock_alert",
    );
   },
   payload.outboxId,
  );
 },
});

EventBroker.subscribe(EventType.USERCART_LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<LowStockAlertPayload>(
   async ({ userId, productName, quantity }) => {
    await NotificationService.createNotification(
     userId,
     "Cart Low Stock Alert",
     `"${productName}" is running low (${quantity} left)`,
     "stock_alert",
    );
   },
   payload.outboxId,
  );
 },
});

EventBroker.subscribe(EventType.ORDER_CANCELLED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderCancelledPayload>(
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
   payload.outboxId,
  );
 },
});

EventBroker.subscribe(EventType.PAYMENT_FULFILLED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaymentFulfilledPayload>(
   async ({ updatedOrder }) => {
    if (!updatedOrder?.userId) return;

    await NotificationService.createNotification(
     updatedOrder.userId,
     "Payment Successful",
     `Payment received — order #${updatedOrder.id.slice(0, 8)} is now fulfilled`,
     "payment_update",
    );
   },
   payload.outboxId,
  );
 },
});

EventBroker.subscribe(EventType.PAYMENT_INITIALIZED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaymentInitializedPayload>(
   async ({ userId, orderId }) => {
    if (!userId) return;

    await NotificationService.createNotification(
     userId,
     "Payment Initialized",
     `Your payment for order #${orderId.slice(0, 8)} has been initialized`,
     "payment_update",
    );
   },
   payload.outboxId,
  );
 },
});

EventBroker.subscribe(EventType.PAYMENT_FAILED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaymentFailedPayload>(
   async ({ userId, orderId, reason }) => {
    if (!userId) return;

    await NotificationService.createNotification(
     userId,
     "Payment Failed",
     `Third-party payment for order #${orderId.slice(0, 8)} failed — ${reason}`,
     "payment_update",
    );
   },
   payload.outboxId,
  );
 },
});
