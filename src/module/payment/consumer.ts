/** @format */
import { formatErrorPayload } from "@error/format-error.ts";
import { EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";

import PaymentService from "./payment.service.ts";

onEvent(EventType.PAYSTACK_PAYMENT_INITIALIZED).subscribe({
  next: async (payload) => {
   try {
    const { paystackData, userId, orderId } = payload.payload;
    const [data, err] = await PaymentService.handlePaymentInitialized(
     userId,
     orderId,
     { ...paystackData, paymentProvider: "paystack" },
    );
    if (err) throw err;
    console.log("[...Paystack initialised]:", { data });
   } catch (err) {
    console.error("[Background Event Error]:", formatErrorPayload(err instanceof Error ? err : new Error(String(err))).body);
   }
  },
  error: (err) => console.error(err),
 });

onEvent(EventType.PAYSTACK_PAYMENT_VERIFIED).subscribe({
  next: async (payload) => {
   try {
    const { event } = payload.payload;
    const [data, err] = await PaymentService.handlePaystackPaymentVerified(event);
    if (err) throw err;
    console.log("[...Paystack verification completed]:", { data });
   } catch (err) {
    console.error("[Background Event Error]:", formatErrorPayload(err instanceof Error ? err : new Error(String(err))).body);
   }
  },
  error: (err) => console.error(err),
 });

onEvent(EventType.STRIPE_PAYMENT_INITIALIZED).subscribe({
  next: async (payload) => {
   try {
    const { stripeData, userId, orderId } = payload.payload;
    const [data, err] = await PaymentService.handlePaymentInitialized(
     userId,
     orderId,
     { ...stripeData, paymentProvider: "stripe" },
    );
    if (err) throw err;
    console.log("[...Stripe initialised]:", { data });
   } catch (err) {
    console.error("[Background Event Error]:", formatErrorPayload(err instanceof Error ? err : new Error(String(err))).body);
   }
  },
  error: (err) => console.error(err),
 });

onEvent(EventType.STRIPE_PAYMENT_VERIFIED).subscribe({
  next: async (payload) => {
   try {
    const { event: session, eventType } = payload.payload;
    const [data, err] = await PaymentService.handleStripePaymentVerified(session, eventType);
    if (err) throw err;
    console.log("[...Stripe verification completed]:", { data });
   } catch (err) {
    console.error("[Background Event Error]:", formatErrorPayload(err instanceof Error ? err : new Error(String(err))).body);
   }
  },
  error: (err) => console.error(err),
 });
