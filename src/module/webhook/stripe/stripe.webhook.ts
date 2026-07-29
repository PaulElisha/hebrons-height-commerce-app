/** @format */

import logger from "@app/logger.ts";
import stripeClient from "@app/stripe.ts";
import HttpStatus from "@shared/enum/http.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import Env from "env.ts";
import { Request, Response } from "express";
import Stripe from "stripe";

export const stripeWebhookHandler = async (req: Request, res: Response) => {
 const sig = req.headers["stripe-signature"]!;
 let event: Stripe.Event;

 try {
  event = stripeClient.webhooks.constructEvent(
   req.body,
   sig,
   Env.STRIPE_WEBHOOK_SECRET,
  );
 } catch (error: any) {
  return res
   .status(HttpStatus.BAD_REQUEST)
   .send(`Webhook Error: ${error.message}`);
 }

 try {
  switch (event.type) {
   case "checkout.session.completed":
   case "checkout.session.expired": {
    const session = event.data.object;

    await publishEvent({
     event_type: EventType.STRIPE_PAYMENT_VERIFIED,
     payload: {
      event: session,
      eventType: event.type,
     },
    });

    break;
   }
   default:
    logger.warn({ eventType: event.type }, "Unhandled Stripe event type");
    break;
  }

  return res.status(HttpStatus.OK).json({ received: true });
 } catch (error: any) {
  return res
   .status(HttpStatus.INTERNAL_SERVER_ERROR)
   .send(`Webhook Error ${error?.message}`);
 }
};
