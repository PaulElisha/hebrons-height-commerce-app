/** @format */
import { Subject } from "rxjs";

export enum EventType {
 ORDER_PLACED = "order.placed",
 ORDER_ACCEPTED = "order.accepted",
 ORDER_REJECTED = "order.rejected",
 ORDER_PENDING = "order.pending",
 ORDER_CANCELLED = "order.cancelled",
 UPDATE_INVENTORY = "inventory.update",
 STRIPE_PAYMENT_INITIALIZED = "payment.stripe.checkout.initialized",
 PAYSTACK_PAYMENT_INITIALIZED = "payment.paystack.checkout.initialized",
 PAYSTACK_PAYMENT_VERIFIED = "payment.paystack.checkout.verified",
 STRIPE_PAYMENT_VERIFIED = "payment.stripe.checkout.verified",
}

export interface EventContract {
 event_type: string | "error";
 payload: any;
}

const eventBus$ = new Subject<EventContract>();
export default eventBus$;
