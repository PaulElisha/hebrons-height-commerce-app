/** @format */

import HttpStatus from "@shared/enum/http.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { Request, Response } from "express";

export const paystackWebhookHandler = async (req: Request, res: Response) => {
 const body = req.body;
 const eventName = body.event;
 try {
  if (eventName !== "charge.success" && eventName !== "charge.failed") {
   return { handled: false };
  }

  const orderId = body.data?.metadata?.orderId;

  await publishEvent({
   event_type: EventType.PAYSTACK_PAYMENT_VERIFIED,
   payload: {
    orderId,
    event: body,
   },
  });

  return res.status(HttpStatus.OK).json({ received: true });
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  return res
   .status(HttpStatus.INTERNAL_SERVER_ERROR)
   .send(`Webhook Error ${message}`);
 }
};
