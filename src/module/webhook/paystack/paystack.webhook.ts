/** @format */

import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import { EventType } from "@shared/event-bus/config.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";

export const paystackWebhookHandler = async (body: any) => {
 const eventName = body.event;

 if (eventName !== "charge.success" && eventName !== "charge.failed") {
  return { handled: false };
 }

 const orderId = body.data?.metadata?.orderId as string | undefined;

 if (!orderId) {
  throw new BadRequestException(
   "Order Id for payment is required",
   HttpStatus.BAD_REQUEST,
   ErrorCode.VALIDATION_ERROR,
  );
 }

 PublishEvent({
  event_type: EventType.PAYSTACK_PAYMENT_VERIFIED,
  payload: {
   orderId,
   event: body,
  },
 });
};
