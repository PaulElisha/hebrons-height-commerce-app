/** @format */
import db from "@db/db.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import { cartItem } from "@db/schema/cart.ts";
import {
 EventBroker,
 EventType,
 OrderPlacedPayload,
} from "@shared/event-bus/index.ts";
import { and, eq } from "drizzle-orm";

import CartBase from "./base.ts";

EventBroker.subscribe(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderPlacedPayload>(
   payload.outboxId,
   async ({ userId, cartId }) => {
    await db
     .delete(cartItem)
     .where(and(eq(cartItem.userId, userId), eq(cartItem.cartId, cartId)));

    await CartBase.calculateTotalAmount(cartId, userId);
   },
  );
 },
});
