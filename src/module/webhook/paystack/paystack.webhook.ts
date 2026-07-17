/** @format */

import { EventType } from "@shared/event-bus/config.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";

export const paystackWebhookHandler = async (body: any) => {
 const eventName = body.event;

 if (eventName !== "charge.success" && eventName !== "charge.failed") {
  return { handled: false };
 }

 const orderId = body.data?.metadata?.orderId;

 PublishEvent({
  event_type: EventType.PAYSTACK_PAYMENT_VERIFIED,
  payload: {
   orderId,
   event: body,
  },
 });
};
