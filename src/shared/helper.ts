/** @format */
import db from "@db/db.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { merchant } from "@schema/merchant.ts";
import { order } from "@schema/order.ts";
import { product } from "@schema/product.ts";
import { TCartAndItem, Transaction } from "@shared/types.ts";
import { and, eq, sum } from "drizzle-orm";

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

export const checkItemExistsInCart =
 (tx: Transaction) => async (cartId: string, productId: string) => {
  const existingItem = await tx
   .select()
   .from(cartItem)
   .where(and(eq(cartItem.cartId, cartId), eq(cartItem.productId, productId)))
   .limit(1);
  return existingItem[0];
 };

export const getProductAllocatedQuantity = async (
 tx: Transaction,
 productId: string,
): Promise<any> => {
 const [allocatedQuantity] = await tx
  .select({ totalQuantity: sum(cartItem.quantity) })
  .from(cartItem)
  .where(eq(cartItem.productId, productId))
  .limit(1);
 return allocatedQuantity;
};

export async function getMerchantIdFromProductId(
 productId: string,
): Promise<String> {
 const [productMerchant] = await db
  .select()
  .from(product)
  .innerJoin(merchant, eq(product.merchantId, merchant.id))
  .where(eq(product.id, productId));

 return String(productMerchant?.merchant?.id);
}

export function createPublicId(
 folder: "product_images" | "additional_images" | "avatar" | "product_videos",
) {
 return `${folder}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function validateOrderForCart(cartId: string, userId: string) {
 return await db
  .select()
  .from(order)
  .where(and(eq(order.cartId, cartId), eq(order.userId, userId)));
}
