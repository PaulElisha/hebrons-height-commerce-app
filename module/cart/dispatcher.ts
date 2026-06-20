/** @format */

import { and, eq, sql, sum } from "drizzle-orm";

import { product } from "../../schema/product.ts";
import { cartItem } from "../../schema/cart.ts";
import type { Transaction } from "../../shared/types.ts";
import * as helper from "../../shared/helper.ts";

export const CartActions: Record<
 string,
 (tx: Transaction) => (cartId: string, productId: string) => any
> = {
 add: (tx: Transaction) => async (cartId: string, productId: string) => {
  const existing = await helper.checkItemExists(tx)(cartId, productId);
  if (existing) return;

  const [{ price, quantity: available }] = await tx
   .select({ price: product.price, quantity: product.quantity })
   .from(product)
   .where(eq(product.id, productId))
   .limit(1);

  const totalInCarts = await helper.getTotalInAllCarts(tx, productId);
  if (totalInCarts + 1 > available) return;

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
  const [{ quantity: available }] = await tx
   .select({ quantity: product.quantity })
   .from(product)
   .where(eq(product.id, productId))
   .limit(1);

  if (available <= 0) return;

  const totalInCarts = await helper.getTotalInAllCarts(tx, productId);
  if (totalInCarts + 1 > available) return;

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
  const [item] = await tx
   .select({ quantity: cartItem.quantity })
   .from(cartItem)
   .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)))
   .limit(1);

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
