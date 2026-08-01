/** @format */
import { account, jwks, session, user, verification } from "@schema/auth.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { category, subcategory } from "@schema/category.ts";
import { merchant } from "@schema/merchant.ts";
import { notification } from "@schema/notification.ts";
import { order, orderItem } from "@schema/order.ts";
import { outbox } from "@schema/outbox.ts";
import { payment } from "@schema/payment.ts";
import { product } from "@schema/product.ts";

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
 outbox,
 subcategory,
 order,
 orderItem,
 payment,
};
