/** @format */
import db from "@db/db.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { category, subcategory } from "@schema/category.ts";
import { merchant } from "@schema/merchant.ts";
import { order } from "@schema/order.ts";
import { product } from "@schema/product.ts";
import {
 AssetType,
 Pagination,
 Result,
 T,
 TCartAndItem,
 TCartItem,
 TMerchantProducts,
} from "@shared/types.ts";
import { and, eq, inArray, isNull } from "drizzle-orm";

import * as APIError from "./error/APIError.ts";
import AppError from "./error/app-error.ts";

export async function fetchMerchantProductsFromDb(
 merchantId: string,
): Promise<Result<TMerchantProducts, AppError>> {
 try {
  const productsForMerchant = await db
   .select()
   .from(product)
   .innerJoin(merchant, eq(merchant.id, product.merchantId))
   .where(
    and(
     eq(merchant.id, merchantId),
     isNull(product.deletedAt),
     isNull(merchant.deletedAt),
    ),
   );

  return [
   {
    merchant: productsForMerchant[0]?.merchant || null,
    products: productsForMerchant?.map((p) => p.product) || [],
   },
   null,
  ];
 } catch (err) {
  return [null, APIError.internalServer("Failed to fetch merchant products")];
 }
}

export async function fetchMerchantProductsByUserId(
 userId: string,
): Promise<Result<TMerchantProducts, AppError>> {
 try {
  const productsForMerchant = await db
   .select()
   .from(product)
   .innerJoin(merchant, eq(merchant.id, product.merchantId))
   .where(and(eq(merchant.userId, userId), isNull(merchant.deletedAt)));

  return [
   {
    merchant: productsForMerchant[0]?.merchant || null,
    products: productsForMerchant?.map((p) => p.product) || [],
   },
   null,
  ];
 } catch (err) {
  return [null, APIError.internalServer("Failed to fetch merchant products")];
 }
}

export function merchantIdSubquery(userId: string) {
 return db
  .select({ id: merchant.id })
  .from(merchant)
  .where(and(eq(merchant.userId, userId), isNull(merchant.deletedAt)));
}

export async function getMerchantIdFromUser(
 userId: string,
): Promise<Result<string, AppError>> {
 const [relatedMerchant] = await db
  .select({ id: merchant?.id })
  .from(merchant)
  .where(and(eq(merchant?.userId, userId), isNull(merchant.deletedAt)))
  .limit(1);

 if (!relatedMerchant)
  return [null, APIError.notFound("Merchant profile not found")];

 return [relatedMerchant.id, null];
}

export async function getMerchantIdFromProductId(
 productId: string,
): Promise<Result<string, AppError>> {
 const [productMerchant] = await db
  .select()
  .from(product)
  .innerJoin(merchant, eq(product.merchantId, merchant.id))
  .where(and(eq(product.id, productId), isNull(merchant.deletedAt)));

 if (!productMerchant)
  return [null, APIError.notFound("Merchant not found for this product")];

 return [productMerchant.merchant.id, null];
}

export const getCartAndItems = async (
 cartId: string,
 userId: string,
): Promise<Result<TCartAndItem, AppError>> => {
 try {
  const cartAndItems = await db
   .select()
   .from(cart)
   .leftJoin(cartItem, eq(cartItem.cartId, cart.id))
   .where(and(eq(cart.userId, userId), eq(cart.id, cartId)));

  if (!cartAndItems[0]?.cart)
   return [null, APIError.notFound("Cart not found")];

  return [
   {
    cart: cartAndItems[0].cart,
    cart_items: cartAndItems
     .map((i) => i.cart_items)
     .filter(Boolean) as TCartItem[],
   },
   null,
  ];
 } catch (err) {
  return [null, APIError.internalServer("Failed to fetch cart")];
 }
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

export function createPublicId(folder: AssetType, userId: string) {
 return `${folder}-${userId}`;
}

export async function validateOrderForCart(
 cartId: string,
 userId: string,
): Promise<Result<any[], AppError>> {
 try {
  const result = await db
   .select()
   .from(order)
   .where(
    and(
     eq(order.cartId, cartId),
     eq(order.userId, userId),
     eq(order.orderStatus, "pending"),
    ),
   );

  return [result, null];
 } catch (err) {
  return [null, APIError.badRequest("Order already created")];
 }
}

export function parsePagination(pagination?: Pagination) {
 const limit = Math.min(Math.max(pagination?.pageSize ?? 10, 1), 50);
 const pageNumber = Math.max(pagination?.pageNumber ?? 1, 1);
 const offset = (pageNumber - 1) * limit;
 return { limit, pageNumber, offset };
}

export async function getMerchantProduct(
 userId: string,
 productId: string,
): Promise<Result<T<"product">, AppError>> {
 const [existingProduct] = await db
  .select()
  .from(product)
  .where(
   and(
    eq(product.id, productId),
    inArray(product.merchantId, merchantIdSubquery(userId)),
   ),
  )
  .limit(1);

 if (!existingProduct)
  return [
   null,
   APIError.notFound("Product not found or not owned by merchant"),
  ];

 return [existingProduct, null];
}

export async function resolveCategoryId(
 categoryName?: string,
 subCategoryName?: string,
): Promise<{
 categoryId: string | undefined;
 subCategoryId: string | undefined;
}> {
 if (!categoryName) return { categoryId: undefined, subCategoryId: undefined };

 const [matched] = await db
  .select({ id: category.id })
  .from(category)
  .where(eq(category.name, categoryName))
  .limit(1);

 if (!matched) return { categoryId: undefined, subCategoryId: undefined };

 const [subMatched] = await db
  .select({ id: subcategory.id })
  .from(subcategory)
  .where(
   and(
    eq(subcategory.categoryId, matched.id),
    eq(subcategory.name, subCategoryName!),
   ),
  )
  .limit(1);

 return {
  categoryId: matched.id,
  subCategoryId: subMatched?.id,
 };
}
