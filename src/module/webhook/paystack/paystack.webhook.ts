/** @format */

import { EventBus, EventType } from "@shared/event-bus/index.ts";

export const paystackWebhookHandler = async (body: any) => {
 const eventName = body.event;

 if (eventName !== "charge.success" && eventName !== "charge.failed") {
  return { handled: false };
 }

 const orderId = body.data?.metadata?.orderId;

 EventBus.publish({
  event_type: EventType.PAYSTACK_PAYMENT_VERIFIED,
  payload: {
   orderId,
   event: body,
  },
 });
};
