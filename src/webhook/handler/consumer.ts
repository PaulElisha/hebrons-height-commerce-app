/** @format */
import logger from "@app/logger.ts";
import WebHookHandler from "@webhook/handler/payment.handler.ts";
import {
 EventBroker,
 EventType,
 PaymentFailedPayload,
 PaymentInitializedPayload,
 PaystackPaymentVerifiedPayload,
 StripePaymentVerifiedPayload,
} from "@shared/event-bus/index.ts";
import { consumeOutboxEvent } from "@shared/util/outbox-consumer.ts";

EventBroker.subscribe(EventType.PAYMENT_INITIALIZED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaymentInitializedPayload>(
   async ({ paymentResponseData, userId, orderId }) => {
    const [, err] = await WebHookHandler.handlePaymentInitialized(
     userId,
     orderId,
     paymentResponseData,
    );
    if (err) throw err;
    logger.info({ userId, orderId }, "[...Paystack initialised]");
   },
   payload.outboxId,
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

EventBroker.subscribe(EventType.PAYSTACK_PAYMENT_VERIFIED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaystackPaymentVerifiedPayload>(
   async ({ eventData, orderId }) => {
    const [, err] = await WebHookHandler.handlePaystackPaymentVerified(
     eventData,
     orderId,
    );
    if (err) throw err;
    logger.info({}, "[...Paystack verification completed]");
   },
   payload.outboxId,
  );
 },
 error: (err: unknown) => {
  const msg = err instanceof Error ? err?.message : String(err);

  logger.error({ err: msg }, "Error consuming Paystack payment verified event");

  throw err;
 },
});

EventBroker.subscribe(EventType.STRIPE_PAYMENT_VERIFIED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<StripePaymentVerifiedPayload>(
   async ({ eventData, orderId }) => {
    const [, err] = await WebHookHandler.handleStripePaymentVerified(
     eventData,
     orderId,
    );
    if (err) throw err;
    logger.info({}, "[...Stripe verification completed]");
   },
   payload.outboxId,
  );
 },
 error: (err: unknown) => {
  const msg = err instanceof Error ? err?.message : String(err);

  logger.error({ err: msg }, "Error consuming Stripe payment verified event");

  throw err;
 },
});

EventBroker.subscribe(EventType.PAYMENT_FAILED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaymentFailedPayload>(
   async ({ userId, orderId, reason, paymentId }) => {
    const [, err] = await WebHookHandler.handlePaymentFailure(paymentId);
    if (err) throw err;
   },
   payload.outboxId,
  );
 },
 error: (err: unknown) => {
  const msg = err instanceof Error ? err?.message : String(err);
  logger.error({ err: msg }, "Error consuming payment failed event");
  throw err;
 },
});
