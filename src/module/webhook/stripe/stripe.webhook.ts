/** @format */
import { eq } from "drizzle-orm";
import Env from "env.ts";
import { Request, Response } from "express";
import Stripe from "stripe";

import stripeClient from "@app/stripe.ts";
import db from "@db/db.ts";

import HttpStatus from "@shared/enum/http.ts";
import { EventType } from "@shared/event-bus/config.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";

import { order } from "@schema/order.ts";
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
   case "checkout.session.completed": {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleOrderCheckoutCompleted(session);
    break;
   }
   case "checkout.session.expired": {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleOrderCheckoutFailed(session);
    break;
   }
   default:
    console.log(`Unhandled event type: ${event.type}`);
    break;
  }
  return res.status(HttpStatus.OK).json({ received: true });
 } catch (error: any) {
  return res
   .status(HttpStatus.INTERNAL_SERVER_ERROR)
   .send(`Webhook Error ${error?.message}`);
 }
};

async function handleOrderCheckoutCompleted(session: Stripe.Checkout.Session) {
 const orderId = session.metadata?.orderId;
 if (!orderId) {
  console.log("No OrderId in session metadata");
  return;
 }

 try {
  PublishEvent({
   event_type: EventType.STRIPE_PAYMENT_VERIFIED,
   payload: {
    orderId,
    provider: "stripe",
   },
  });

  console.log(`Order marked as paid`);
 } catch (error) {
  console.log("Error updating order");
  return;
 }
}

async function handleOrderCheckoutFailed(session: Stripe.Checkout.Session) {
 const orderId = session.metadata?.orderId;
 if (!orderId) {
  console.log("No OrderId in session metadata");
  return;
 }

 try {
  await db
   .update(order)
   .set({
    orderStatus: "failed",
    paymentStatus: "failed",
   })
   .where(eq(order.id, orderId));

  console.log(`Order marked as failed`);
 } catch (error) {
  console.log("Error updating order");
  return;
 }
}
