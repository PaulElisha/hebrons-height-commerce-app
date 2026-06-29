/** @format */

import db from "@db/db.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { eq, and } from "drizzle-orm";

import CartBase from "./base.ts";
import { APIResponse } from "@shared/types.ts";
import { TCartAndItem } from "./cart.controller.ts";

// interface CartParams {
//  productId: string;
// }

class CartService {
 addToCart = async (
  userId: string,
  productId: string,
 ): Promise<TCartAndItem> => {
  const data = await CartBase.modifyCart({
   userId,
   productId,
   intent: "add",
  });

  return data;
 };

 removeFromCart = async (
  userId: string,
  productId: string,
 ): Promise<TCartAndItem> => {
  const data = await CartBase.modifyCart({
   userId,
   productId,
   intent: "remove",
  });

  return data;
 };

 incrementItem = async (
  userId: string,
  productId: string,
 ): Promise<TCartAndItem> => {
  const data = await CartBase.modifyCart({
   userId,
   productId,
   intent: "increment",
  });

  return data;
 };

 decrementItem = async (
  userId: string,
  productId: string,
 ): Promise<TCartAndItem> => {
  const data = await CartBase.modifyCart({
   userId,
   productId,
   intent: "decrement",
  });

  return data;
 };

 getUserCart = async (
  userId: string,
  cartId: string,
 ): Promise<TCartAndItem> => {
  const result = await db
   .select()
   .from(cart)
   .leftJoin(cartItem, eq(cart.id, cartItem.cartId))
   .where(and(eq(cart.userId, userId), eq(cart.id, cartId)))
   .limit(1);

  return {
   cart: {
    ...result[0].cart,
    subtotal: result[0].cart.subtotal as number,
   },
   cart_items: result
    .filter((r) => r.cart_items)
    .map((r) => ({
     ...r.cart_items!,
     totalItemPrice: r.cart_items!.totalItemPrice as number,
    })),
  };
 };
}

export default new CartService();
