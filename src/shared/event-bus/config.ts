/** @format */

export enum EventType {
 ORDER_PLACED = "order.placed",
 ORDER_ACCEPTED = "order.accepted",
 ORDER_REJECTED = "order.rejected",
 ORDER_PENDING = "order.pending",
 ORDER_CANCELLED = "order.cancelled",
 ORDER_STATUS_UPDATED = "order.status.updated",
 UPDATE_INVENTORY = "inventory.update",
 LOW_STOCK_ALERT = "inventory.low_stock",
 STRIPE_PAYMENT_INITIALIZED = "payment.stripe.checkout.initialized",
 PAYSTACK_PAYMENT_INITIALIZED = "payment.paystack.checkout.initialized",
 PAYSTACK_PAYMENT_VERIFIED = "payment.paystack.checkout.verified",
 STRIPE_PAYMENT_VERIFIED = "payment.stripe.checkout.verified",
}
