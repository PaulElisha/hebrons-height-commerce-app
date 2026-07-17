/** @format */
import { and, eq, isNotNull, sum } from "drizzle-orm";

import db from "@db/db.ts";

import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import NotFoundException from "@shared/error/not-found.ts";
import { Result, Transaction } from "@shared/types.ts";

import { cartItem } from "@schema/cart.ts";
import { orderItem } from "@schema/order.ts";
import { product } from "@schema/product.ts";
class InventoryService {
 getProductThreshold = async (
  productId: string,
 ): Promise<Result<any, AppError>> => {
  const [data] = await db
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
 };

 checkInventoryThreshold = async (
  tx: Transaction,
  productId: string,
 ): Promise<Result<number, AppError>> => {
  const [{ price, currentQuantity }, e] =
   await this.getProductThreshold(productId);

  if (e) throw e;

  const currentAllocatedQuantityForProduct =
   await this.getProductAllocatedQuantity(tx, productId);

  const currentAllocatedTotal =
   currentAllocatedQuantityForProduct?.totalQuantity
    ? Number(currentAllocatedQuantityForProduct?.totalQuantity)
    : 0;

  if (currentAllocatedTotal + 1 > currentQuantity)
   return [
    null,
    new InternalServerError(
     "Product threshold exceeded",
     HttpStatus.UNPROCESSABLE_ENTITY,
     ErrorCode.INTERNAL_SERVER_ERROR,
    ),
   ];

  return [price, null];
 };

 getProductAllocatedQuantity = async (
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

 updateProductThreshold = async (
  productId: string,
  orderId: string,
  action: "placeOrder" | "cancelOrder",
 ): Promise<Result<void, AppError>> => {
  try {
   const [productData, e] = await this.getProductThreshold(productId);

   if (e) return [null, e];

   const currentQuantity = Number(productData?.quantity);

   return await db.transaction(async (tx: Transaction) => {
    const [ItemQuantityPurchased] = await tx
     .select({ quantityPurchased: orderItem.quantity })
     .from(orderItem)
     .where(
      and(eq(orderItem.orderId, orderId), eq(orderItem.productId, productId)),
     );

    if (!ItemQuantityPurchased) {
     return [
      null,
      new BadRequestException(
       "This product was not part of the original order.",
       HttpStatus.BAD_REQUEST,
       ErrorCode.VALIDATION_ERROR,
      ),
     ];
    }

    const newQuantity =
     action === "cancelOrder"
      ? currentQuantity + ItemQuantityPurchased.quantityPurchased
      : currentQuantity - ItemQuantityPurchased.quantityPurchased;

    if (action === "placeOrder") {
     await tx
      .update(product)
      .set({
       quantity: newQuantity,
       status: newQuantity <= 0 ? "sold_out" : "available",
      })
      .where(and(eq(product.id, productId), isNotNull(product.quantity)));
    } else if (action === "cancelOrder") {
     await tx
      .update(product)
      .set({
       quantity: newQuantity,
       status: "available",
      })
      .where(eq(product.id, productId));
    }

    return [null, null];
   });
  } catch (error) {
   return [null, error as AppError];
  }
 };
}

export default new InventoryService();
