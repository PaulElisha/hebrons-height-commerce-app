/** @format */
import { formatErrorPayload } from "@shared/error/format-error.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";
import FA from "fasy";

import InventoryService from "./inventory.service.ts";

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  try {
   const { orderId, productIds } = payload.payload;
   console.log("[Inventory update for Order placement]:", {
    product_ids: productIds,
   });

   await FA.concurrent.map(async (productId: any) => {
    const [, err] = await InventoryService.updateProductThreshold(
     productId,
     orderId,
     "placeOrder",
    );
    if (err) throw err;
   }, productIds);
  } catch (err) {
   const formatted = formatErrorPayload(
    err instanceof Error ? err : new Error(String(err)),
   );
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (err) => {
  console.error(err);
 },
});

EventBus.on(EventType.ORDER_CANCELLED).subscribe({
 next: async (payload) => {
  try {
   const { orderId, productIds } = payload.payload;
   console.log("[Inventory update for Order cancelled]:", {
    product_ids: productIds,
   });

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
   const formatted = formatErrorPayload(
    err instanceof Error ? err : new Error(String(err)),
   );
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (err) => {
  console.error(err);
 },
});
