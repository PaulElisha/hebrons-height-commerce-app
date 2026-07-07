/** @format */

import { account, jwks, session, user, verification } from "@schema/auth.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { merchant } from "@schema/merchant.ts";
import { order, orderItem } from "@schema/order.ts";
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
 order,
 orderItem,
 payment,
};
