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
import { Result, Transaction } from "@shared/types.ts";
import { and, eq, isNotNull, sum } from "drizzle-orm";

class InventoryService {
 getProductThreshold = async (tx: Transaction, productId: string) => {
  const [{ price, quantity: threshold }] = await tx
   .select({ price: product.price, quantity: product.quantity })
   .from(product)
   .where(and(eq(product.id, productId), isNotNull(product.quantity)))
   .limit(1);

  return [price, threshold];
 };

 checkInventoryThreshold = async (
  tx: Transaction,
  productId: string,
 ): Promise<Result<number, AppError>> => {
  const [price, currentQuantity] = await this.getProductThreshold(
   tx,
   productId,
  );

  if (currentQuantity <= 0)
   return [
    null,
    new NotFoundException(
     "Product is out of stock",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];

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
 ) => {
  await db.transaction(async (tx: Transaction) => {
   const [price, currentQuantity] = await this.getProductThreshold(
    tx,
    productId,
   );

   if (action === "placeOrder") {
    if (currentQuantity <= 0) {
     throw new NotFoundException(
      "Product is out of stock",
      HttpStatus.NOT_FOUND,
      ErrorCode.RESOURCE_NOT_FOUND,
     );
    }

    const newQuantity = currentQuantity - 1;

    await tx
     .update(product)
     .set({
      quantity: currentQuantity - 1,
      status: newQuantity === 0 ? "sold_out" : "available",
     })
     .where(and(eq(product.id, productId), isNotNull(product.quantity)));
   } else if (action === "cancelOrder") {
    const [ItemQuantityPurchased] = await tx
     .select({ quantityPurchased: orderItem.quantity })
     .from(orderItem)
     .where(
      and(eq(orderItem.orderId, orderId), eq(orderItem.productId, productId)),
     );

    if (!ItemQuantityPurchased) {
     throw new BadRequestException(
      "This product was not part of the original order.",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
     );
    }

    await tx
     .update(product)
     .set({
      quantity: currentQuantity + ItemQuantityPurchased.quantityPurchased,
     })
     .where(eq(product.id, productId));
   }
  });
 };
}

export default new InventoryService();
