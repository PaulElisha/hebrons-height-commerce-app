/** @format */

import { EventContract, EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";

onEvent<EventContract>(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  const { orderId, productIds } = payload.payload;
  console.log("Inventory update for Order placement:", productIds);
 },
 error: (error) => {
  console.error(error);
 },
});
