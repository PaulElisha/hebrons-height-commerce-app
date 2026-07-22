/** @format */
import db from "@db/db.ts";
import { cartItem } from "@schema/cart.ts";
import { and, eq, sql } from "drizzle-orm";

export const CartActions: Record<string, (...args: any[]) => any> = {
 add: async (
  cartId: string,
  userId: string,
  productId: string,
  price: number,
 ) => {
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
  return inserted;
 },
 increment: async (cartId: string, userId: string, productId: string) => {
  return await db
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
 },
 decrement: async (cartId: string, userId: string, productId: string) => {
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
   return await db
    .delete(cartItem)
    .where(
     and(
      eq(cartItem.cartId, cartId),
      eq(cartItem.productId, productId),
      eq(cartItem.userId, userId),
     ),
    )
    .returning();
  }

  return await db
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
 },
 remove: async (cartId: string, userId: string, productId: string) => {
  return await db
   .delete(cartItem)
   .where(
    and(
     eq(cartItem.cartId, cartId),
     eq(cartItem.productId, productId),
     eq(cartItem.userId, userId),
    ),
   )
   .returning();
 },
};

export default CartActions;
