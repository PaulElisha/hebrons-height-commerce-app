/** @format */
import { cartItem } from "@schema/cart.ts";
import * as helper from "@shared/helper.ts";
import type { Transaction } from "@shared/types.ts";
import { and, eq, sql } from "drizzle-orm";

export const CartActions: Record<
 string,
 (tx: Transaction) => (...args: any[]) => any
> = {
 add:
  (tx: Transaction) =>
  async (cartId: string, userId: string, productId: string, price: number) => {
   const [inserted] = await tx
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
 increment:
  (tx: Transaction) =>
  async (cartId: string, userId: string, productId: string) => {
   return await tx
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
 decrement:
  (tx: Transaction) =>
  async (
   cartId: string,
   userId: string,
   productId: string,
   quantity: number,
  ) => {
   const item = await helper.checkItemExistsInCart(tx)(cartId, productId);

   if (!item || item.quantity <= 1) {
    return await tx
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

   return await tx
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
 remove:
  (tx: Transaction) =>
  async (cartId: string, userId: string, productId: string) => {
   return await tx
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
