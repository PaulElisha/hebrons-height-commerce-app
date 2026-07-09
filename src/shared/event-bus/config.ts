/** @format */

import { Subject } from "rxjs";

export enum EventType {
 ORDER_PLACED = "order.placed",
 ORDER_ACCEPTED = "order.accepted",
 ORDER_REJECTED = "order.rejected",
 ORDER_PENDING = "order.pending",
 ORDER_CANCELLED = "order.cancelled",
 UPDATE_INVENTORY = "inventory.update",
 PAYMENT_VERIFIED = "payment.checkout.verified",
 PAYMENT_INITIALIZED = "payment.checkout.initialized",
}

export interface EventContract {
 event_type: string | "error";
 payload: any;
}

const eventBus$ = new Subject<EventContract>();
export default eventBus$;
