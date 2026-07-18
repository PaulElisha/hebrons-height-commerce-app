/** @format */
import db from "@db/db.ts";
import { cart, cartItem } from "@schema/cart.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import NotFoundException from "@shared/error/not-found.ts";
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

  if (!result.length || !result[0].cart) {
   return [
    null,
    new NotFoundException(
     "Cart not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

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
