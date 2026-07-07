/** @format */

import { Subject } from "rxjs";

export enum EventType {
 ORDER_PLACED = "order.placed",
 ORDER_ACCEPTED = "order.accepted",
 ORDER_REJECTED = "order.rejected",
 ORDER_COMPLETED = "ORDER_COMPLETED",
 ORDER_PENDING = "order.pending",
 ORDER_CANCELLED = "order.cancelled",
 USER_REGISTERED = "USER_REGISTERED",
 USER_VERIFIED = "USER_VERIFIED",
 UPDATE_INVENTORY = "inventory.update",
}

export interface EventContract {
 event_type: string | "error";
 payload: any;
}

const eventBus$ = new Subject<EventContract>();
export default eventBus$;
