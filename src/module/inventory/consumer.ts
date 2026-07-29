/** @format */
import logger from "@app/logger.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";
import FA from "fasy";

import InventoryService from "./inventory.service.ts";

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  try {
   const { userId, orderId, productIds } = payload.payload;
   logger.info({ productIds }, "[Inventory update for Order placement]");

   await FA.concurrent.map(async (productId: any) => {
    const [, err] = await InventoryService.updateProductThreshold(
     productId,
     orderId,
     "placeOrder",
    );
    if (err) throw err;
   }, productIds);
  } catch (err) {
   logger.error({ err }, "[Background Event Error Intercepted]");
  }
 },
 error: (err) => {
  logger.error({ err });
 },
});

EventBus.on(EventType.ORDER_CANCELLED).subscribe({
 next: async (payload) => {
  try {
   const { orderId, productIds } = payload.payload;
   logger.info({ productIds }, "[Inventory update for Order cancelled]");

   const results = await FA.concurrent.map(async (productId: string) => {
    return await InventoryService.updateProductThreshold(
     productId,
     orderId,
     "cancelOrder",
    );
   }, productIds);

   for (const [_, err] of results) {
    if (err) {
     throw err;
    }
   }
  } catch (err) {
   logger.error({ err }, "[Background Event Error Intercepted]");
  }
 },
 error: (err) => {
  logger.error({ err });
 },
});
