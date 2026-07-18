/** @format */
import db from "@db/db.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { merchant } from "@schema/merchant.ts";
import { order } from "@schema/order.ts";
import { product } from "@schema/product.ts";
import ErrorCode from "./enum/error-code.ts";
import HttpStatus from "./enum/http.ts";
import AppError from "./error/app-error.ts";
import NotFoundException from "./error/not-found.ts";
import { Result, TCartAndItem, TProductThreshold } from "@shared/types.ts";
import { and, eq, isNotNull } from "drizzle-orm";

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

export async function getMerchantIdFromUser(
 userId: string,
): Promise<Result<string, AppError>> {
 const [relatedMerchant] = await db
  .select({ id: merchant?.id })
  .from(merchant)
  .where(eq(merchant?.userId, userId))
  .limit(1);

 if (!relatedMerchant) {
  return [
   null,
   new NotFoundException(
    "Merchant profile not found",
    HttpStatus.NOT_FOUND,
    ErrorCode.RESOURCE_NOT_FOUND,
   ),
  ];
 }

 return [relatedMerchant.id, null];
}

export async function getMerchantIdFromProductId(
 productId: string,
): Promise<Result<string, AppError>> {
 const [productMerchant] = await db
  .select()
  .from(product)
  .innerJoin(merchant, eq(product.merchantId, merchant.id))
  .where(eq(product.id, productId));

 if (!productMerchant) {
  return [
   null,
   new NotFoundException(
    "Merchant not found for this product",
    HttpStatus.NOT_FOUND,
    ErrorCode.RESOURCE_NOT_FOUND,
   ),
  ];
 }

 return [productMerchant.merchant.id, null];
}

export const getCartAndItems = async (
 cartId: string,
 userId: string,
): Promise<TCartAndItem> => {
 const cartAndItems = await db
  .select()
  .from(cart)
  .leftJoin(cartItem, eq(cartItem.cartId, cartId))
  .where(and(eq(cart.userId, userId), eq(cartItem.cartId, cartId)));

 return {
  cart: cartAndItems[0]?.cart,
  cart_items: cartAndItems?.map((i) => i?.cart_items),
 } as TCartAndItem;
};

export const checkItemExistsInCart = async (
 cartId: string,
 productId: string,
) => {
 const existingItem = await db
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
    eq(order.orderStatus, "pending"),
   ),
  );
}

export async function getProductThreshold(
 productId: string,
): Promise<Result<TProductThreshold, AppError>> {
 const [data] = await db
  .select({ price: product.price, quantity: product.quantity })
  .from(product)
  .where(and(eq(product.id, productId), isNotNull(product.quantity)))
  .limit(1);

 if (!data) {
  return [
   null,
   new NotFoundException(
    "Product not found",
    HttpStatus.NOT_FOUND,
    ErrorCode.RESOURCE_NOT_FOUND,
   ),
  ];
 }

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
