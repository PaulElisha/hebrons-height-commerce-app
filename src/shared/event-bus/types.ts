/** @format */
import type { TOrder, TPayment } from "@shared/types.ts";
import type { Observable } from "rxjs";
import { EventType } from "./config.ts";
import { PaymentResponseData } from "@module/payment/payment.service.ts";

export interface EventContract {
 event_type: string;
 payload: Record<string, unknown> & { userId?: string; outboxId?: string };
}

export interface IEventBroker<EventContract> {
 publish(event: EventContract): void;
 subscribe(
  event: (typeof EventType)[keyof typeof EventType],
 ): Observable<EventContract>;
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
 merchantUserIds: string[];
 message?: string;
}

export interface OrderCancelledPayload {
 userId: string;
 orderId: string;
 productIds: string[];
}

export interface LowStockAlertPayload {
 productId: string;
 userId: string;
 productName: string;
 quantity: number;
}

export interface ChargeEvent {
 event: string;

 reference: string;
 amount: number;
 paid_at: Date;
 gateway_response?: string;
}

export interface PaystackPaymentVerifiedPayload {
 orderId: string;
 eventData: ChargeEvent;
}

export interface StripePaymentVerifiedPayload {
 orderId: string;
 eventData: ChargeEvent;
}

export interface PaymentFulfilledPayload {
 updatedPayment: TPayment;
 updatedOrder: TOrder;
}

export interface PaymentFailedPayload {
 userId: string;
 orderId: string;
 reason: string;
 paymentId: string;
}

export interface PaymentInitializedPayload {
 paymentResponseData: PaymentResponseData;
 userId: string;
 orderId: string;
}
