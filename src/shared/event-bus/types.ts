/** @format */
import type { PaymentCheckoutResult } from "@module/payment/payment.service.ts";
import type { Observable } from "rxjs";
import type Stripe from "stripe";

import { EventType } from "./config.ts";

export interface EventContract {
 event_type: string;
 userId?: string;
 payload: Record<string, unknown>;
}

export type OutboxEventContract = EventContract & {
 payload: Record<string, unknown> & { outboxId: string };
};

export interface IEventBus<EventContract> {
 publish(event: EventContract): void;
 on(
  event: (typeof EventType)[keyof typeof EventType],
 ): Observable<EventContract>;
 subscribe(): Observable<EventContract>;
}

export interface OrderPlacedPayload {
 userId: string;
 cartId: string;
 orderId: string;
 productIds: string[];
}

export interface OrderStatusUpdatedPayload {
 userId: string;
 orderId: string;
 status: string;
 message?: string;
}

export interface OrderCancelledPayload {
 userId: string;
 orderId: string;
 productIds: string[];
}

export interface LowStockAlertPayload {
 productId: string;
 merchantId: string | null;
 productName: string;
 quantity: number;
}

export interface CartLowStockAlertPayload {
 productId: string;
 userId: string;
 productName: string;
 quantity: number;
}

export type PaymentInitializedData = Omit<PaymentCheckoutResult, "metadata">;

export interface PaystackPaymentInitializedPayload {
 paystackData: PaymentInitializedData;
 userId: string;
 orderId: string;
}

export interface StripePaymentInitializedPayload {
 stripeData: PaymentInitializedData;
 userId: string;
 orderId: string;
}

export interface PaystackChargeEvent {
 event: string;
 data?: {
  reference: string;
  amount: number;
  paid_at?: string;
 };
}

export interface PaystackPaymentVerifiedPayload {
 event: PaystackChargeEvent;
}

export interface StripePaymentVerifiedPayload {
 event: Stripe.Checkout.Session;
 eventType: string;
}
