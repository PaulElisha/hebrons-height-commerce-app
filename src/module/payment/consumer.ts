/** @format */
import logger from "@app/logger.ts";
import WebHookHandler from "@module/webhook/handler/payment.handler.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";

EventBus.on(EventType.PAYSTACK_PAYMENT_INITIALIZED).subscribe({
 next: async (payload) => {
  try {
   const { paystackData, userId, orderId } = payload.payload;
   const [data, err] = await WebHookHandler.handlePaymentInitialized(
    userId,
    orderId,
    { ...paystackData, paymentProvider: "paystack" },
   );
   if (err) throw err;
   logger.info({ data }, "[...Paystack initialised]");
  } catch (err) {
   logger.error({ err }, "[Background Event Error]:");
  }
 },
 error: (err) => logger.error({ err }),
});

EventBus.on(EventType.PAYSTACK_PAYMENT_VERIFIED).subscribe({
 next: async (payload) => {
  try {
   const { event } = payload.payload;
   const [data, err] =
    await WebHookHandler.handlePaystackPaymentVerified(event);
   if (err) throw err;
   logger.info({ data }, "[...Paystack verification completed]");
  } catch (err) {
   logger.error({ err }, "[Background Event Error]");
  }
 },
 error: (err) => logger.error({ err }),
});

EventBus.on(EventType.STRIPE_PAYMENT_INITIALIZED).subscribe({
 next: async (payload) => {
  try {
   const { stripeData, userId, orderId } = payload.payload;
   const [data, err] = await WebHookHandler.handlePaymentInitialized(
    userId,
    orderId,
    { ...stripeData, paymentProvider: "stripe" },
   );
   if (err) throw err;
   logger.info({ data }, "[...Stripe initialised]");
  } catch (err) {
   logger.error({ err }, "[Background Event Error]");
  }
 },
 error: (err) => logger.error({ err }),
});

EventBus.on(EventType.STRIPE_PAYMENT_VERIFIED).subscribe({
 next: async (payload) => {
  try {
   const { event: session, eventType } = payload.payload;
   const [data, err] = await WebHookHandler.handleStripePaymentVerified(
    session,
    eventType,
   );
   if (err) throw err;
   logger.info({ data }, "[...Stripe verification completed]");
  } catch (err) {
   logger.error({ err }, "[Background Event Error]");
  }
 },
 error: (err) => logger.error({ err }),
});
