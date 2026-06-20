/** @format */
import { sql, eq, and, isNotNull } from "drizzle-orm";
import { Mutex } from "async-mutex";

import { db } from "../auth/db.ts";
import { cartItem, cart } from "../../schema/cart.ts";
import { type Transaction } from "../../shared/types.ts";
import * as helper from "../../shared/helper.ts";

const mutex = new Mutex();

const calculateTotalAmount =
 (tx: Transaction) => async (cartId: string, userId: string) => {
  const [result] = await tx
   .select({
    subtotal: sql<number>`COALESCE(SUM(${cartItem.totalItemPrice}), 0)`,
   })
   .from(cartItem)
   .where(and(eq(cartItem.cartId, cartId), isNotNull(cartItem.id)));

  await tx
   .update(cart)
   .set({
    subtotal: result.subtotal,
   })
   .where(and(eq(cart.id, cartId), eq(cart.userId, userId)));
 };

export const modifyCart = async (
 userId: string,
 productId: string,
 callback: (tx: Transaction) => (cartId: string, productId: string) => any,
) => {
 return await mutex.runExclusive(async () => {
  return await db.transaction(async (tx: Transaction) => {
   let [userCart] = await tx
    .select()
    .from(cart)
    .where(eq(cart.userId, userId))
    .limit(1);

   if (!userCart) {
    [userCart] = await tx.insert(cart).values({ userId }).returning();
   }

   await callback(tx)(userCart.id, productId);
   await calculateTotalAmount(tx)(userCart.id, userId);

   return await helper.getCartAndItems(tx)(userCart.id, userId);
  });
 });
};
