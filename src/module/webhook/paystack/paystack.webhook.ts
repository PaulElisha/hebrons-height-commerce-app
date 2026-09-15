/** @format */

import HttpStatus from "@shared/enum/http.ts";
import * as APIError from "@shared/error/APIError.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { Request, Response } from "express";
import { findPaymentByReference } from "@shared/helper.ts";

export const paystackWebhookHandler = async (req: Request, res: Response) => {
 const body = req.body;
 const eventName = body.event;
 try {
  switch (eventName) {
   case "charge.success": {
    const orderId = body.data?.metadata?.orderId;

    await publishEvent({
     event_type: EventType.PAYSTACK_PAYMENT_VERIFIED,
     payload: {
      orderId,
      event: body,
     },
    });
    return res.status(HttpStatus.OK).json({ received: true });
   }

   case "charge.failed": {
    const reference = body.data?.reference;
    const orderId = body.data?.metadata?.orderId;
    const reason: string =
     body.data?.gateway_response ?? "Third-party payment failed";

    const [paymentRecord, err] = await findPaymentByReference(reference);

    if (err || !paymentRecord) throw APIError.notFound("Payment not found");

    await publishEvent({
     event_type: EventType.PAYMENT_FAILED,
     payload: {
      userId: paymentRecord.userId,
      orderId,
      reason,
      paymentId: paymentRecord.id,
     },
    });
    return res.status(HttpStatus.OK).json({ received: true });
   }

   default:
    return { handled: false };
  }
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  return res
   .status(HttpStatus.INTERNAL_SERVER_ERROR)
   .send(`Webhook Error ${message}`);
 }
};
