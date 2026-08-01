/** @format */
import db from "@db/db.ts";
import MerchantService from "@module/merchant/merchant.service.ts";
import OrderService from "@module/order/order.service.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import { user } from "@schema/auth.ts";
import { merchant } from "@schema/merchant.ts";
import {
 CartLowStockAlertPayload,
 EventBus,
 EventType,
 OrderPlacedPayload,
} from "@shared/event-bus/index.ts";
import { and, eq, isNull } from "drizzle-orm";
import FA from "fasy";

import EmailWorker from "./email.worker.ts";

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderPlacedPayload>(
   payload.outboxId,
   async ({ userId, orderId }) => {
    const [orderDetails, err] = await OrderService.getOrderWithUser(
     userId,
     orderId,
    );
    if (err || !orderDetails) throw err;

    await EmailWorker({
     user: orderDetails.user,
     message: `Hi ${orderDetails.user.name}, your order #${orderId} is confirmed!`,
    });
   },
  );
 },
});

EventBus.on(EventType.CART_LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<CartLowStockAlertPayload>(
   payload.outboxId,
   async ({ userId, productName, quantity }) => {
    const [userDetails] = await db
     .select({ name: user.name, email: user.email })
     .from(user)
     .where(eq(user.id, userId))
     .limit(1);

    await EmailWorker({
     user: { id: userId, name: userDetails.name, email: userDetails.email },
     message: `"${productName}" is running low (${quantity} left)`,
    });
   },
  );
 },
});

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderPlacedPayload>(
   payload.outboxId,
   async ({ orderId, productIds }) => {
    await FA.concurrent.map(async (productId: string) => {
     const [merchantForProduct, err] =
      await MerchantService.getMerchantIdFromProductId(productId);
     if (err || !merchantForProduct) throw err;

     const [userMerchant] = await db
      .select({
       businessName: merchant.businessName,
       user: { id: user.id, email: user.email, name: user.name },
      })
      .from(merchant)
      .innerJoin(user, eq(merchant.userId, user.id))
      .where(
       and(eq(merchant.id, merchantForProduct.id), isNull(merchant.deletedAt)),
      );

     await EmailWorker({
      user: userMerchant.user,
      message: `Hi ${userMerchant.user.name}, a purchase of #${orderId} has been made for your product`,
     });
    }, productIds);
   },
  );
 },
});
