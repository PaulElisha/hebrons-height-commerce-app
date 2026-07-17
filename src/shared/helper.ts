/** @format */
import { and, eq, isNotNull, ne } from "drizzle-orm";

import db from "@db/db.ts";

import { Result, TCartAndItem, Transaction } from "@shared/types.ts";

import { cart, cartItem } from "@schema/cart.ts";
import { merchant } from "@schema/merchant.ts";
import { order } from "@schema/order.ts";
import { product } from "@schema/product.ts";

import ErrorCode from "./enum/error-code.ts";
import HttpStatus from "./enum/http.ts";
import AppError from "./error/app-error.ts";
import NotFoundException from "./error/not-found.ts";
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

export async function getMerchantIdFromProductId(
 tx: Transaction,
 productId: string,
): Promise<string> {
 const [productMerchant] = await tx
  .select()
  .from(product)
  .innerJoin(merchant, eq(product.merchantId, merchant.id))
  .where(eq(product.id, productId));

 return productMerchant?.merchant.id;
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

export function createPublicId(
 folder: "product_images" | "additional_images" | "avatar" | "product_videos",
) {
 return `${folder}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function validateOrderForCart(cartId: string, userId: string) {
 return await db
  .select()
  .from(order)
  .where(
   and(
    eq(order.cartId, cartId),
    eq(order.userId, userId),
    ne(order.orderStatus, "cancelled"),
   ),
  );
}

export async function getProductThreshold(
 tx: Transaction,
 productId: string,
): Promise<Result<any, AppError>> {
 const [data] = await tx
  .select({ price: product.price, quantity: product.quantity })
  .from(product)
  .where(and(eq(product.id, productId), isNotNull(product.quantity)))
  .limit(1);

 if (data.quantity <= 0) {
  return [
   null,
   new NotFoundException(
    "Product is out of stock",
    HttpStatus.NOT_FOUND,
    ErrorCode.RESOURCE_NOT_FOUND,
   ),
  ];
 }

 return [data, null];
}
