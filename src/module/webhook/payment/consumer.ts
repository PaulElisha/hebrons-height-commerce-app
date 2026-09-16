/** @format */
import logger from "@app/logger.ts";
import { consumeOutboxEvent } from "@shared/util/outbox-consumer.ts";
import WebHookHandler from "@module/webhook/payment/payment.handler.ts";
import {
 EventBroker,
 EventType,
 PaystackPaymentVerifiedPayload,
 PaymentFailedPayload,
 StripePaymentVerifiedPayload,
 PaymentInitializedPayload,
} from "@shared/event-bus/index.ts";

EventBroker.subscribe(EventType.PAYMENT_INITIALIZED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaymentInitializedPayload>(
   payload.outboxId,
   async ({ paymentResponseData, userId, orderId }) => {
    const [, err] = await WebHookHandler.handlePaymentInitialized(
     userId,
     orderId,
     paymentResponseData,
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

EventBroker.subscribe(EventType.PAYSTACK_PAYMENT_VERIFIED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaystackPaymentVerifiedPayload>(
   payload.outboxId,
   async ({ eventData, orderId }) => {
    const [, err] = await WebHookHandler.handlePaystackPaymentVerified(
     eventData,
     orderId,
    );
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

EventBroker.subscribe(EventType.STRIPE_PAYMENT_VERIFIED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<StripePaymentVerifiedPayload>(
   payload.outboxId,
   async ({ eventData, orderId }) => {
    const [, err] = await WebHookHandler.handleStripePaymentVerified(
     eventData,
     orderId,
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

EventBroker.subscribe(EventType.PAYMENT_FAILED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaymentFailedPayload>(
   payload.outboxId,
   async ({ userId, orderId, reason, paymentId }) => {
    const [, err] = await WebHookHandler.handlePaymentFailure(paymentId);
    if (err) throw err;
   },
  );
 },
 error: (err: unknown) => {
  const msg = err instanceof Error ? err?.message : String(err);
  logger.error({ err: msg }, "Error consuming payment failed event");
  throw err;
 },
});
