/** @format */
import { EventBus, EventType } from "@shared/event-bus/index.ts";

EventBus.on(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  // const { orderId, product_ids } = payload.payload;
  // console.log("Inventory update for Order placement:", product_ids);
 },
 error: (err) => {
  console.error(err);
 },
});
