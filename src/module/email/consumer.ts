/** @format */
import { user } from "@db/schema/auth.ts";
import OrderService from "@module/order/order.service.ts";
import {
 EventBroker,
 EventType,
 OrderPlacedPayload,
} from "@shared/event-bus/index.ts";
import { consumeOutboxEvent } from "@shared/util/outbox-consumer.ts";

import EmailWorker from "./email.worker.ts";

EventBroker.subscribe(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderPlacedPayload>(async ({ userId, orderId }) => {
   const [orderDetails, err] = await OrderService.getOrderWithUser(
    userId,
    orderId,
   );
   if (err || !orderDetails) throw err;

   await EmailWorker("orderConfirmation", {
    user: orderDetails.user,
    message: `Hi ${orderDetails.user.name}, your order #${orderId} is confirmed!`,
   });
  }, payload.outboxId);
 },
});

// EventBroker.subscribe(EventType.USERCART_LOW_STOCK_ALERT).subscribe({
//  next: async ({ payload }) => {
//   await consumeOutboxEvent<LowStockAlertPayload>(
//    async ({ userId, productName, quantity }) => {
//     const [userDetails] = await db
//      .select({ name: user.name, email: user.email })
//      .from(user)
//      .where(eq(user.id, userId))
//      .limit(1);

//     await EmailWorker({
//      user: { id: userId, name: userDetails.name, email: userDetails.email },
//      message: `"${productName}" is running low (${quantity} left)`,
//     });
//    },
//    payload.outboxId,
//   );
//  },
// });

// EventBroker.subscribe(EventType.ORDER_PLACED).subscribe({
//  next: async ({ payload }) => {
//   await consumeOutboxEvent<OrderPlacedPayload>(
//    async ({ orderId, productIds }) => {
//     await FA.concurrent.map(async (productId: string) => {
//      const [merchantId, err] = await getMerchantIdFromProductId(productId);
//      if (err || !merchantId) throw err;

//      const [userMerchant] = await db
//       .select({
//        businessName: merchant.businessName,
//        user: { id: user.id, email: user.email, name: user.name },
//       })
//       .from(merchant)
//       .innerJoin(user, eq(merchant.userId, user.id))
//       .where(and(eq(merchant.id, merchantId), isNull(merchant.deletedAt)));

//      await EmailWorker({
//       user: userMerchant.user,
//       message: `Hi ${userMerchant.user.name}, a purchase of #${orderId} has been made for your product`,
//      });
//     }, productIds);
//    },
//    payload.outboxId,
//   );
//  },
// });
