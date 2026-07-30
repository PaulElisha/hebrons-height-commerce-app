/** @format */
import logger from "@app/logger.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";
import FA from "fasy";

import InventoryService from "./inventory.service.ts";

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { orderId, productIds } = p as {
    orderId: string;
    productIds: string[];
   };
   logger.info({ productIds }, "[Inventory update for Order placement]");

   await FA.concurrent.map(async (productId: string) => {
    const [, err] = await InventoryService.updateProductThreshold(
     productId,
     orderId,
     "placeOrder",
    );
    if (err) throw err;
   }, productIds);
  });
 },
});

EventBus.on(EventType.ORDER_CANCELLED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { orderId, productIds } = p as {
    orderId: string;
    productIds: string[];
   };
   logger.info({ productIds }, "[Inventory update for Order cancelled]");

   await FA.concurrent.map(async (productId: string) => {
    const [, err] = await InventoryService.updateProductThreshold(
     productId,
     orderId,
     "cancelOrder",
    );
    if (err) throw err;
   }, productIds);
  });
 },
});
