/** @format */
import { account, jwks, session, user, verification } from "@schema/auth.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { category, subcategory } from "@schema/category.ts";
import { merchant } from "@schema/merchant.ts";
import { notification } from "@schema/notification.ts";
import { order, orderItem } from "@schema/order.ts";
import { payment } from "@schema/payment.ts";
import { product } from "@schema/product.ts";
import { pushSubscription } from "@schema/push-subscription.ts";

export default {
 user,
 verification,
 account,
 session,
 jwks,
 merchant,
 product,
 cart,
 cartItem,
 category,
 notification,
 pushSubscription,
 subcategory,
 order,
 orderItem,
 payment,
};
