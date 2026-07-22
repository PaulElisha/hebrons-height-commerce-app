/** @format */
import db from "@db/db.ts";
import { cartItem } from "@schema/cart.ts";
import { order, orderItem } from "@schema/order.ts";
import { product } from "@schema/product.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import NotFoundException from "@shared/error/not-found.ts";
import { EventBus, EventType } from "@shared/event-bus/index.ts";
import { Result, TProduct, TProductThreshold } from "@shared/types.ts";
import { and, eq, isNotNull, ne, sql, sum } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";

const STOCK_THRESHOLDS = [10, 5, 3, 1] as const;

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
  const [productData, err] = await this.getProductThreshold(productId);

  if (err || !productData) return [null, err];

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

 checkLowStock = async (productId: string) => {
  const [current] = await db
   .select({
    quantity: product.quantity,
    name: product.name,
    merchantId: product.merchantId,
   })
   .from(product)
   .where(eq(product.id, productId))
   .limit(1);

  if (!current) return;

  for (const threshold of STOCK_THRESHOLDS) {
   if (current.quantity === threshold) {
    EventBus.publish({
     event_type: EventType.LOW_STOCK_ALERT,
     payload: {
      productId,
      productName: current.name,
      quantity: current.quantity,
      merchantId: current.merchantId,
     },
    });
    return;
   }
  }
 };

 @Transactional()
 async updateProductThreshold(
  productId: string,
  orderId: string,
  action: "placeOrder" | "cancelOrder",
 ): Promise<Result<TProduct, AppError>> {
  try {
   const [_, err] = await this.getProductThreshold(productId);

   if (err) return [null, err];

   const [ItemQuantityPurchased] = await db
    .select({ quantityPurchased: orderItem.quantity })
    .from(orderItem)
    .innerJoin(order, eq(orderItem.orderId, order.id))
    .where(
     and(
      eq(orderItem.orderId, orderId),
      eq(orderItem.productId, productId),
      action === "placeOrder"
       ? and(
          ne(order.orderStatus, "cancelled"),
          ne(order.paymentStatus, "paid"),
         )
       : eq(order.orderStatus, "cancelled"),
     ),
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

   let updatedProduct: TProduct | undefined;

   if (action === "placeOrder") {
    [updatedProduct] = await db
     .update(product)
     .set({
      quantity: sql`${product.quantity} - ${ItemQuantityPurchased.quantityPurchased}`,
      status: sql`CASE WHEN ${product.quantity} - ${ItemQuantityPurchased.quantityPurchased} <= 0 THEN 'sold_out' ELSE 'available' END`,
     })
     .where(and(eq(product.id, productId), isNotNull(product.quantity)))
     .returning();
   } else if (action === "cancelOrder") {
    [updatedProduct] = await db
     .update(product)
     .set({
      quantity: sql`${product.quantity} + ${ItemQuantityPurchased.quantityPurchased}`,
      status: "available",
     })
     .where(eq(product.id, productId))
     .returning();
   }

   await this.checkLowStock(productId);

   return [updatedProduct ?? null, null];
  } catch (err) {
   return [
    null,
    new InternalServerError(
     err instanceof Error ? err.message : "Unknown error",
     HttpStatus.INTERNAL_SERVER_ERROR,
     ErrorCode.INTERNAL_SERVER_ERROR,
    ),
   ];
  }
 }
}

export default new InventoryService();
