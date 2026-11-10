/** @format */

import Env from "@/env.ts";
import logger from "@app/logger.ts";
import { BachsWebhookError, webhooks } from "@bachs/sdk";
import type { CheckoutSessionResponse, WebhookEvent } from "@bachs/sdk";
import HttpStatus from "@shared/enum/http.ts";
import * as APIError from "@shared/error/APIError.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { findPaymentByReference } from "@shared/helper.ts";
import { Request, Response } from "express";

export const bachsWebhookHandler = async (req: Request, res: Response) => {
 const rawBody = req.body;

 let event: WebhookEvent;

 try {
  event = webhooks.constructEvent(
   rawBody,
   req.headers,
   Env.BACHS_WEBHOOK_SECRET,
  );
 } catch (error) {
  if (error instanceof BachsWebhookError) {
   return res
    .status(HttpStatus.BAD_REQUEST)
    .json({ received: false, message: "Invalid Bachs signature" });
  }

  throw error;
 }

 const session = event.data as CheckoutSessionResponse;

 try {
  switch (event.type) {
   case "checkout.completed":
   case "collection.succeeded": {
    const reference = session.checkout_id;
    const orderId = session.metadata?.orderId;

    await publishEvent({
     event_type: EventType.BACHS_PAYMENT_VERIFIED,
     payload: {
      orderId,
      eventData: {
       event: event.type,
       reference,
       amount: Number(session.amount ?? 0),
       paid_at: new Date(event.created_at),
      },
     },
    });

    return res.status(HttpStatus.OK).json({ received: true });
   }

   case "checkout.expired": {
    const reference = session.checkout_id as string;

    const [paymentRecord, err] = await findPaymentByReference(reference);

    if (err || !paymentRecord) throw APIError.notFound("Payment not found");

    await publishEvent({
     event_type: EventType.PAYMENT_FAILED,
     payload: {
      userId: paymentRecord.userId,
      orderId: paymentRecord.orderId,
      reason: "Checkout session expired",
      paymentId: paymentRecord.id,
     },
    });

    return res.status(HttpStatus.OK).json({ received: true });
   }

   default:
    logger.info({ eventType: event.type }, "[...Unhandled Bachs event type]");
    return res.status(HttpStatus.OK).json({ received: true });
  }
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  logger.error({ err: message, eventType: event.type }, "[...Bachs webhook]");

  return res
   .status(HttpStatus.INTERNAL_SERVER_ERROR)
   .send(`Webhook Error ${message}`);
 }
};
