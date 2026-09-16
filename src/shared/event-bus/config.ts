/** @format */

export enum EventType {
 ORDER_PLACED = "order.placed",
 ORDER_CANCELLED = "order.cancelled",
 ORDER_STATUS_UPDATED = "order.status.updated",
 UPDATE_INVENTORY = "inventory.update",
 MERCHANT_LOW_STOCK_ALERT = "inventory.low_stock.alert",
 PAYSTACK_PAYMENT_VERIFIED = "payment.paystack.checkout.verified",
 STRIPE_PAYMENT_VERIFIED = "payment.stripe.checkout.verified",
 USERCART_LOW_STOCK_ALERT = "cart.low_stock.alert",
 PAYMENT_FULFILLED = "payment.fulfilled",
 PAYMENT_FAILED = "payment.failed",
 PAYMENT_INITIALIZED = "payment.initialized",
}
