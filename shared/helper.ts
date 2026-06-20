/** @format */
import { eq, and, sum } from "drizzle-orm";

import { db } from "../module/auth/db";
import { product } from "../schema/product";
import { merchant } from "../schema/merchant";
import { cart, cartItem } from "../schema/cart";
import { TCartAndItem, Transaction } from "./types";

export async function fetchMerchantProductsFromDb(merchantId: string) {
 const productsForMerchant = await db
  .select()
  .from(product)
  .innerJoin(merchant, eq(merchant.id, product.merchantId))
  .where(eq(merchant.id, merchantId));

 return {
  merchant: productsForMerchant[0]?.merchant || null,
  products: productsForMerchant?.map((p) => p.product) || [],
 };
}

export async function getMerchantIdFromUser(userId: string): Promise<string> {
 const [relatedMerchant] = await db
  .select({ id: merchant?.id })
  .from(merchant)
  .where(eq(merchant?.userId, userId))
  .limit(1);

 return relatedMerchant?.id;
}

export const getCartAndItems =
 (tx: Transaction) =>
 async (cartId: string, userId: string): Promise<TCartAndItem> => {
  const cartAndItems = await tx
   .select()
   .from(cart)
   .leftJoin(cartItem, eq(cartItem.cartId, cartId))
   .where(and(eq(cart.userId, userId), eq(cartItem.cartId, cartId)));

  return {
   cart: cartAndItems[0]?.cart,
   cart_items: cartAndItems?.map((i) => i?.cart_items),
  } as TCartAndItem;
 };

export const checkItemExists =
 (tx: Transaction) => async (cartId: string, productId: string) => {
  const existingItem = await tx
   .select()
   .from(cartItem)
   .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)))
   .limit(1);
  return existingItem[0];
 };

export const getTotalInAllCarts = async (
 tx: Transaction,
 productId: string,
): Promise<number> => {
 const [{ quantity }] = await tx
  .select({ quantity: sum(cartItem.quantity) })
  .from(cartItem)
  .where(eq(cartItem.productId, productId))
  .limit(1);
 return Number(quantity);
};
