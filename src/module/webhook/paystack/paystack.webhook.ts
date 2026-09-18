/** @format */

import HttpStatus from "@shared/enum/http.ts";
import * as APIError from "@shared/error/APIError.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { Request, Response } from "express";
import { findPaymentByReference } from "@shared/helper.ts";
import Env from "@/env.ts";

export const paystackWebhookHandler = async (req: Request, res: Response) => {
 const event = req.body;
 const eventName = event.event;
 try {
  const orderId = event.data?.metadata?.orderId;
  const reference = event.data?.reference;

  if (!reference)
   return res
    .status(HttpStatus.BAD_REQUEST)
    .json({ received: false, message: "Missing payment reference" });

  switch (eventName) {
   case "charge.success": {
    await publishEvent({
     event_type: EventType.PAYSTACK_PAYMENT_VERIFIED,
     payload: {
      orderId,
      eventData: {
       reference,
       amount: Number(event.data?.amount) / Env.SCALER,
       paid_at: event.data?.paid_at
        ? new Date(event.data.paid_at)
        : new Date(),
      },
     },
    });
    return res.status(HttpStatus.OK).json({ received: true });
   }

   case "charge.failed": {
    const reason: string =
     event.data?.gateway_response ?? "Third-party payment failed";

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
    return res.status(HttpStatus.OK).json({ received: true });
  }
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  return res
   .status(HttpStatus.INTERNAL_SERVER_ERROR)
   .send(`Webhook Error ${message}`);
 }
};
