/** @format */
import { account, jwks, session, user, verification } from "@db/schema/auth.ts";
import { cart, cartItem } from "@db/schema/cart.ts";
import { category, subcategory } from "@db/schema/category.ts";
import { merchant } from "@db/schema/merchant.ts";
import { notification } from "@db/schema/notification.ts";
import { order, orderItem } from "@db/schema/order.ts";
import { outbox } from "@db/schema/outbox.ts";
import { payment } from "@db/schema/payment.ts";
import { product } from "@db/schema/product.ts";

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
