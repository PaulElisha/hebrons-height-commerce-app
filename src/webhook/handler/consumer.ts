/** @format */

// Payment state transitions are handled synchronously:
// - PaymentService.fetchPaymentForOrderByRail -> Handler.handlePaymentInitialized
// - bachs.webhook.ts -> Handler.handleBachsPaymentVerified / handlePaymentFailure
//
// Notifications (PAYMENT_INITIALIZED, PAYMENT_FAILED, PAYMENT_FULFILLED)
// remain event-driven in @module/notification/consumer.ts.

/*
EventBroker.subscribe(EventType.PAYSTACK_PAYMENT_VERIFIED).subscribe({
 next: async ({ payload }) => {
  await consumeOutboxEvent<PaystackPaymentVerifiedPayload>(
   async ({ eventData, orderId }) => {
    const [, err] = await Handler.handlePaystackPaymentVerified(
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
    const [, err] = await Handler.handleStripePaymentVerified(
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
*/
