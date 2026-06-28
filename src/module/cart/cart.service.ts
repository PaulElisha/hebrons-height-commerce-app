/** @format */

import db from "@db/db.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { eq } from "drizzle-orm";

import CartBase from "./base.ts";

// interface CartParams {
//  productId: string;
// }

class CartService {
 addToCart = async (userId: string, productId: string) => {
  const data = await CartBase.modifyCart({
   userId,
   productId,
   intent: "add",
  });

  return data;
 };

 removeFromCart = async (userId: string, productId: string) => {
  const data = await CartBase.modifyCart({
   userId,
   productId,
   intent: "remove",
  });

  return data;
 };

 incrementItem = async (userId: string, productId: string) => {
  const data = await CartBase.modifyCart({
   userId,
   productId,
   intent: "increment",
  });

  return data;
 };

 decrementItem = async (userId: string, productId: string) => {
  const data = await CartBase.modifyCart({
   userId,
   productId,
   intent: "decrement",
  });

  return data;
 };

 getUserCart = async (userId: string) => {
  const result = await db
   .select()
   .from(cart)
   .leftJoin(cartItem, eq(cart.id, cartItem.cartId))
   .where(eq(cart.userId, userId));

  return {
   usercart: result[0].cart,
   cart_items: result.filter((r) => r.cart_items).map((r) => r.cart_items),
  };
 };
}

export default new CartService();
