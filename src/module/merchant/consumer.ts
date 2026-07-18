/** @format */
import { EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";

onEvent(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  // const { orderId, product_ids } = payload.payload;
  // console.log("Inventory update for Order placement:", product_ids);
 },
 error: (err) => {
   console.error(err);
 },
});
