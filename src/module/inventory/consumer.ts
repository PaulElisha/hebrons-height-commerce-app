/** @format */

import { EventContract, EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";
import FA from "fasy";

import InventoryService from "./inventory.service.ts";

onEvent<EventContract>(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  const { orderId, productIds } = payload.payload;
  console.log("Inventory update for Order placement:", productIds);

  await FA.concurrent.map(async (productId: any) => {
   await InventoryService.updateProductThreshold(
    productId,
    orderId,
    "placeOrder",
   );
  }, productIds);
 },
 error: (error) => {
  console.error(error);
 },
});

onEvent<EventContract>(EventType.ORDER_CANCELLED).subscribe({
 next: async (payload) => {
  const { orderId, productId } = payload.payload;
  console.log("Inventory update for Order cancelled:", {
   product_id: productId,
  });

  await InventoryService.updateProductThreshold(
   productId,
   orderId,
   "cancelOrder",
  );
 },
 error: (error) => {
  console.error(error);
 },
});
