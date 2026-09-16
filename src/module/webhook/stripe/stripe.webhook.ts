/** @format */

import logger from "@app/logger.ts";
import stripeClient from "@app/stripe.ts";
import HttpStatus from "@shared/enum/http.ts";
import * as APIError from "@shared/error/APIError.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import PaymentService from "@module/payment/payment.service.ts";
import Env from "@/env.ts";
import { Request, Response } from "express";
import Stripe from "stripe";
import { findPaymentByReference } from "@shared/helper.ts";

export const stripeWebhookHandler = async (req: Request, res: Response) => {
 const sig = req.headers["stripe-signature"]!;
 let event: Stripe.Event;

 try {
  event = stripeClient.webhooks.constructEvent(
   req.body,
   sig,
   Env.STRIPE_WEBHOOK_SECRET,
  );
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${message}`);
 }

 const session = event.data.object as Stripe.Checkout.Session;

 if (!session) throw APIError.badRequest("Stripe payment was unsuccessful ");

 const orderId = session?.metadata?.orderId;

 try {
  switch (event.type) {
   case "checkout.session.completed": {
    const reference = session?.id;
    const paidAmount = Number(session.amount_total) / Env.SCALER;
    const paidAtDate = session.created
     ? new Date(session.created * 1000)
     : new Date();

    await publishEvent({
     event_type: EventType.STRIPE_PAYMENT_VERIFIED,
     payload: {
      orderId,
      eventData: {
       reference,
       paidAmount,
       paidAtDate,
      },
     },
    });
    return res.status(HttpStatus.OK).json({ received: true });
   }

   case "checkout.session.expired": {
    const reason: string = "Checkout session expired";

    const [paymentRecord, err] = await findPaymentByReference(session.id);

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
    logger.warn({ eventType: event.type }, "Unhandled Stripe event type");
    return res.status(HttpStatus.OK).json({ received: true });
  }
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  return res
   .status(HttpStatus.INTERNAL_SERVER_ERROR)
   .send(`Webhook Error ${message}`);
 }
};
