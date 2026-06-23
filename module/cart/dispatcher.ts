/** @format */

import { and, eq, isNotNull, sql, sum } from "drizzle-orm";

import { product } from "../../schema/product.ts";
import { cartItem } from "../../schema/cart.ts";
import type { Transaction } from "../../shared/types.ts";
import * as helper from "../../shared/helper.ts";

export const CartActions: Record<
 string,
 (tx: Transaction) => (...args: any[]) => any
> = {
 add:
  (tx: Transaction) =>
  async (cartId: string, productId: string, price: number) => {
   const existing = await helper.checkItemExists(tx)(cartId, productId);
   if (existing) return;

   const [inserted] = await tx
    .insert(cartItem)
    .values({
     cartId,
     productId,
     price,
     quantity: 1,
     totalItemPrice: price,
    })
    .returning();
   return inserted;
  },
 increment: (tx: Transaction) => async (cartId: string, productId: string) => {
  return await tx
   .update(cartItem)
   .set({
    quantity: sql`${cartItem.quantity} + 1`,
    totalItemPrice: sql`(${cartItem.quantity} + 1) * ${cartItem.price}`,
   })
   .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)))
   .returning();
 },
 decrement: (tx: Transaction) => async (cartId: string, productId: string) => {
  const item = await helper.checkItemExists(tx)(cartId, productId);

  if (!item || item.quantity <= 1) {
   return await tx
    .delete(cartItem)
    .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)))
    .returning();
  }

  return await tx
   .update(cartItem)
   .set({
    quantity: sql`${cartItem.quantity} - 1`,
    totalItemPrice: sql`(${cartItem.quantity} - 1) * ${cartItem.price}`,
   })
   .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)))
   .returning();
 },
 remove: (tx: Transaction) => async (cartId: string, productId: string) => {
  return await tx
   .delete(cartItem)
   .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)))
   .returning();
 },
};

export default CartActions;
