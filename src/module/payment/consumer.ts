/** @format */
import logger from "@app/logger.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import WebHookHandler from "@module/webhook/handler/payment.handler.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";

EventBus.on(EventType.PAYSTACK_PAYMENT_INITIALIZED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { paystackData, userId, orderId } = p as {
    paystackData: any;
    userId: string;
    orderId: string;
   };

   const [, err] = await WebHookHandler.handlePaymentInitialized(
    userId,
    orderId,
    { ...paystackData, paymentProvider: "paystack" },
   );
   if (err) throw err;
   logger.info({ userId, orderId }, "[...Paystack initialised]");
  });
 },
});

EventBus.on(EventType.PAYSTACK_PAYMENT_VERIFIED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { event } = p as { event: any };

   const [, err] = await WebHookHandler.handlePaystackPaymentVerified(event);
   if (err) throw err;
   logger.info({}, "[...Paystack verification completed]");
  });
 },
});

EventBus.on(EventType.STRIPE_PAYMENT_INITIALIZED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { stripeData, userId, orderId } = p as {
    stripeData: any;
    userId: string;
    orderId: string;
   };

   const [, err] = await WebHookHandler.handlePaymentInitialized(
    userId,
    orderId,
    { ...stripeData, paymentProvider: "stripe" },
   );
   if (err) throw err;
   logger.info({ userId, orderId }, "[...Stripe initialised]");
  });
 },
});

EventBus.on(EventType.STRIPE_PAYMENT_VERIFIED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent(payload.outboxId, async (p) => {
   const { event: session, eventType } = p as { event: any; eventType: string };

   const [, err] = await WebHookHandler.handleStripePaymentVerified(
    session,
    eventType,
   );
   if (err) throw err;
   logger.info({}, "[...Stripe verification completed]");
  });
 },
});
