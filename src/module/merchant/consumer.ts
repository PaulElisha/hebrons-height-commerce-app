/** @format */
import { EventContract, EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";
onEvent<EventContract>(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  // const { orderId, product_ids } = payload.payload;
  // console.log("Inventory update for Order placement:", product_ids);
 },
 error: (error) => {
  console.error(error);
 },
});
