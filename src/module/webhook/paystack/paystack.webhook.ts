/** @format */

import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import { EventType } from "@shared/event-bus/config.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";

/** @format */
export const paystackWebhookHandler = async (body: any) => {
 const event = body.event;

 if (event.event !== "charge.success" && event.event !== "charge.failed") {
  return { handled: false };
 }

 const orderId = event.data?.orderId as string | undefined;

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
   event,
  },
 });
};
