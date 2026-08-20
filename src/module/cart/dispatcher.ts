/** @format */
import asError from "@shared/error/as-error.ts";
import db from "@db/db.ts";
import { cartItem } from "@db/schema/cart.ts";
import * as APIError from "@shared/error/APIError.ts";
import { Result, TCartItem } from "@shared/types.ts";
import { and, eq, sql } from "drizzle-orm";

export type CartAction = (
 cartId: string,
 userId: string,
 productId: string,
 price?: number,
) => Promise<Result<TCartItem[]>>;

export const CartActions: Record<string, CartAction> = {
 add: async (cartId: string, userId: string, productId: string, price) => {
  if (price === undefined)
   return [null, APIError.badRequest("Missing product price")];

  try {
   const [inserted] = await db
    .insert(cartItem)
    .values({
     cartId,
     userId,
     productId,
     price,
     quantity: 1,
     totalItemPrice: price,
    })
    .returning();
   return [inserted ? [inserted] : [], null];
  } catch (err) {
   return [null, asError(err)];
  }
 },
 increment: async (cartId: string, userId: string, productId: string) => {
  try {
   const rows = await db
    .update(cartItem)
    .set({
     quantity: sql`${cartItem.quantity} + 1`,
     totalItemPrice: sql`(${cartItem.quantity} + 1) * ${cartItem.price}`,
    })
    .where(
     and(
      eq(cartItem.cartId, cartId),
      eq(cartItem.productId, productId),
      eq(cartItem.userId, userId),
     ),
    )
    .returning();
   return [rows, null];
  } catch (err) {
   return [null, asError(err)];
  }
 },
 decrement: async (cartId: string, userId: string, productId: string) => {
  try {
   const item = await db
    .select()
    .from(cartItem)
    .where(
     and(
      eq(cartItem.cartId, cartId),
      eq(cartItem.productId, productId),
      eq(cartItem.userId, userId),
     ),
    )
    .limit(1)
    .then((r) => r[0]);

   if (!item || item.quantity <= 1) {
    const rows = await db
     .delete(cartItem)
     .where(
      and(
       eq(cartItem.cartId, cartId),
       eq(cartItem.productId, productId),
       eq(cartItem.userId, userId),
      ),
     )
     .returning();
    return [rows, null];
   }

   const rows = await db
    .update(cartItem)
    .set({
     quantity: sql`${cartItem.quantity} - 1`,
     totalItemPrice: sql`(${cartItem.quantity} - 1) * ${cartItem.price}`,
    })
    .where(
     and(
      eq(cartItem.cartId, cartId),
      eq(cartItem.productId, productId),
      eq(cartItem.userId, userId),
     ),
    )
    .returning();
   return [rows, null];
  } catch (err) {
   return [null, asError(err)];
  }
 },
 remove: async (cartId: string, userId: string, productId: string) => {
  try {
   const rows = await db
    .delete(cartItem)
    .where(
     and(
      eq(cartItem.cartId, cartId),
      eq(cartItem.productId, productId),
      eq(cartItem.userId, userId),
     ),
    )
    .returning();
   return [rows, null];
  } catch (err) {
   return [null, asError(err)];
  }
 },
};

export default CartActions;
