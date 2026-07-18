/** @format */
import db from "@db/db.ts";
import { cartItem } from "@schema/cart.ts";
import { orderItem } from "@schema/order.ts";
import { product } from "@schema/product.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import NotFoundException from "@shared/error/not-found.ts";
import { Result, TProductThreshold } from "@shared/types.ts";
import { and, eq, isNotNull, sum } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";

class InventoryService {
 getProductThreshold = async (
  productId: string,
 ): Promise<Result<TProductThreshold, AppError>> => {
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
 };

 checkInventoryThreshold = async (
  productId: string,
 ): Promise<Result<number, AppError>> => {
  const [productData, e] = await this.getProductThreshold(productId);

  if (e || !productData) return [null, e];

  const { price, quantity: currentQuantity } = productData;

  const allocatedQuantity = await db
   .select({ totalQuantity: sum(cartItem.quantity) })
   .from(cartItem)
   .where(eq(cartItem.productId, productId))
   .limit(1)
   .then((r) => r[0]);

  const currentAllocatedTotal = allocatedQuantity?.totalQuantity
   ? Number(allocatedQuantity.totalQuantity)
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

 @Transactional()
 async updateProductThreshold(
  productId: string,
  orderId: string,
  action: "placeOrder" | "cancelOrder",
 ): Promise<Result<void, AppError>> {
  try {
   const [productData, e] = await this.getProductThreshold(productId);

   if (e) return [null, e];

   const currentQuantity = Number(productData?.quantity);

   const [ItemQuantityPurchased] = await db
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
    await db
     .update(product)
     .set({
      quantity: newQuantity,
      status: newQuantity <= 0 ? "sold_out" : "available",
     })
     .where(and(eq(product.id, productId), isNotNull(product.quantity)));
   } else if (action === "cancelOrder") {
    await db
     .update(product)
     .set({
      quantity: newQuantity,
      status: "available",
     })
     .where(eq(product.id, productId));
   }

   return [null, null];
  } catch (error) {
   return [null, error as AppError];
  }
 }
}

export default new InventoryService();
