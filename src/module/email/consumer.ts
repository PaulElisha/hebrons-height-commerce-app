/** @format */
import db from "@db/db.ts";
import OrderService from "@module/order/order.service.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import { user } from "@db/schema/auth.ts";
import { merchant } from "@db/schema/merchant.ts";
import {
 EventBroker,
 EventType,
 LowStockAlertPayload,
 OrderPlacedPayload,
} from "@shared/event-bus/index.ts";
import { and, eq, isNull } from "drizzle-orm";
import FA from "fasy";

import EmailWorker from "./email.worker.ts";
import { getMerchantIdFromProductId } from "@shared/helper.ts";

EventBroker.subscribe(EventType.ORDER_PLACED).subscribe({
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

EventBroker.subscribe(EventType.USERCART_LOW_STOCK_ALERT).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<LowStockAlertPayload>(
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

EventBroker.subscribe(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderPlacedPayload>(
   payload.outboxId,
   async ({ orderId, productIds }) => {
    await FA.concurrent.map(async (productId: string) => {
     const [merchantId, err] = await getMerchantIdFromProductId(productId);
     if (err || !merchantId) throw err;

     const [userMerchant] = await db
      .select({
       businessName: merchant.businessName,
       user: { id: user.id, email: user.email, name: user.name },
      })
      .from(merchant)
      .innerJoin(user, eq(merchant.userId, user.id))
      .where(and(eq(merchant.id, merchantId), isNull(merchant.deletedAt)));

     await EmailWorker({
      user: userMerchant.user,
      message: `Hi ${userMerchant.user.name}, a purchase of #${orderId} has been made for your product`,
     });
    }, productIds);
   },
  );
 },
});
