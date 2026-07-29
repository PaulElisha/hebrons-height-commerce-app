/** @format */
import db from "@db/db.ts";
import { cart, cartItem } from "@schema/cart.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { Result, TCartAndItem } from "@shared/types.ts";
import { and, eq } from "drizzle-orm";

import CartBase from "./base.ts";

class CartService {
 addToCart = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "add",
  });
 };

 removeFromCart = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "remove",
  });
 };

 incrementItem = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "increment",
  });
 };

 decrementItem = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "decrement",
  });
 };

 getUserCart = async (
  userId: string,
  cartId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  const result = await db
   .select()
   .from(cart)
   .leftJoin(cartItem, eq(cart.id, cartItem.cartId))
   .where(and(eq(cart.userId, userId), eq(cart.id, cartId)))
   .limit(1);

  if (result.length === 0 || !result[0].cart)
   return [null, APIError.notFound("Cart not found")];

  return [
   {
    cart: {
     ...result[0].cart,
     subtotal: Number(result[0].cart.subtotal),
    },
    cart_items: result
     .filter((r) => r.cart_items)
     .map((r) => ({
      ...r.cart_items!,
      totalItemPrice: Number(r.cart_items!.totalItemPrice),
     })),
   },
   null,
  ];
 };
}

export default new CartService();
