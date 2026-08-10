/** @format */
import logger from "@app/logger.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import WebHookHandler from "@module/webhook/handler/payment.handler.ts";
import {
 EventBus,
 EventType,
 PaystackPaymentInitializedPayload,
 PaystackPaymentVerifiedPayload,
 StripePaymentInitializedPayload,
 StripePaymentVerifiedPayload,
} from "@shared/event-bus/index.ts";

EventBus.on(EventType.PAYSTACK_PAYMENT_INITIALIZED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaystackPaymentInitializedPayload>(
   payload.outboxId,
   async ({ paystackData, userId, orderId }) => {
    const [, err] = await WebHookHandler.handlePaymentInitialized(
     userId,
     orderId,
     { ...paystackData, paymentProvider: "paystack" },
    );
    if (err) throw err;
    logger.info({ userId, orderId }, "[...Paystack initialised]");
   },
  );
 },
 error: (err: unknown) => {
  const msg = err instanceof Error ? err?.message : String(err);

  logger.error(
   { err: msg },
   "Error consuming Paystack payment initialized event",
  );

  throw err;
 },
});

EventBus.on(EventType.PAYSTACK_PAYMENT_VERIFIED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaystackPaymentVerifiedPayload>(
   payload.outboxId,
   async ({ event }) => {
    const [, err] = await WebHookHandler.handlePaystackPaymentVerified(event);
    if (err) throw err;
    logger.info({}, "[...Paystack verification completed]");
   },
  );
 },
 error: (err: unknown) => {
  const msg = err instanceof Error ? err?.message : String(err);

  logger.error({ err: msg }, "Error consuming Paystack payment verified event");

  throw err;
 },
});

EventBus.on(EventType.STRIPE_PAYMENT_INITIALIZED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<StripePaymentInitializedPayload>(
   payload.outboxId,
   async ({ stripeData, userId, orderId }) => {
    const [, err] = await WebHookHandler.handlePaymentInitialized(
     userId,
     orderId,
     { ...stripeData, paymentProvider: "stripe" },
    );
    if (err) throw err;
    logger.info({ userId, orderId }, "[...Stripe initialised]");
   },
  );
 },
 error: (err: unknown) => {
  const msg = err instanceof Error ? err?.message : String(err);

  logger.error(
   { err: msg },
   "Error consuming Stripe payment initialized event",
  );

  throw err;
 },
});

EventBus.on(EventType.STRIPE_PAYMENT_VERIFIED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<StripePaymentVerifiedPayload>(
   payload.outboxId,
   async ({ event: session, eventType }) => {
    const [, err] = await WebHookHandler.handleStripePaymentVerified(
     session,
     eventType,
    );
    if (err) throw err;
    logger.info({}, "[...Stripe verification completed]");
   },
  );
 },
 error: (err: unknown) => {
  const msg = err instanceof Error ? err?.message : String(err);

  logger.error({ err: msg }, "Error consuming Stripe payment verified event");

  throw err;
 },
});
