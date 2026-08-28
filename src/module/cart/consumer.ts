/** @format */
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import {
 EventBroker,
 EventType,
 OrderPlacedPayload,
} from "@shared/event-bus/index.ts";

import CartBase from "./base.ts";

EventBroker.subscribe(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<OrderPlacedPayload>(
   payload.outboxId,
   async ({ userId, cartId }) => {
    await CartBase.clearCartItems(cartId, userId);
   },
  );
 },
});
