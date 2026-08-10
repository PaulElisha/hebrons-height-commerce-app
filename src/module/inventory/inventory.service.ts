/** @format */
import db from "@db/db.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { order, orderItem } from "@schema/order.ts";
import { product } from "@schema/product.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { Result, T, TProductThreshold } from "@shared/types.ts";
import { and, eq, isNotNull, lt, ne, sql, sum } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
import FA from "fasy";

const STOCK_THRESHOLDS = [10, 5, 3, 1] as const;

class InventoryService {
 checkProductThreshold = async (
  productId: string,
 ): Promise<Result<TProductThreshold, AppError>> => {
  const [data] = await db
   .select({ price: product.price, quantity: product.quantity })
   .from(product)
   .where(and(eq(product.id, productId), isNotNull(product.quantity)))
   .limit(1);

  if (!data) return [null, APIError.notFound("Product not found")];

  if (data.quantity <= 0)
   return [null, APIError.notFound("Product is out of stock")];

  return [data, null];
 };

 checkInventoryThreshold = async (
  productId: string,
 ): Promise<Result<number, AppError>> => {
  const [productData, err] = await this.checkProductThreshold(productId);

  if (err || !productData) return [null, err];

  const { quantity: currentQuantity, price } = productData;

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
   return [null, APIError.internalServer("Out of stock")];

  return [Number(price), null];
 };

 checkUserStockAtIntervals = async (
  productId: string,
 ): Promise<Result<void, AppError>> => {
  try {
   const result = await db
    .select({
     userId: cartItem.userId,
     name: product.name,
     quantity: product.quantity,
    })
    .from(cartItem)
    .innerJoin(cart, eq(cart.id, cartItem.cartId))
    .innerJoin(product, eq(cartItem.productId, product.id))
    .where(
     and(
      eq(cartItem.productId, productId),
      lt(product.quantity, STOCK_THRESHOLDS[0]),
     ),
    );

   if (result.length <= 0) return [null, null];

   await FA.concurrent.map(async ({ userId, name, quantity }: any) => {
    await publishEvent({
     event_type: EventType.CART_LOW_STOCK_ALERT,
     userId,
     payload: {
      productId,
      productName: name,
      quantity: quantity,
     },
    });
   }, result);

   return [null, null];
  } catch (err) {
   return [null, APIError.internalServer("Failed to check user stock")];
  }
 };

 checkLowStock = async (productId: string): Promise<Result<void, AppError>> => {
  try {
   const [current] = await db
    .select({
     quantity: product.quantity,
     name: product.name,
     merchantId: product.merchantId,
    })
    .from(product)
    .where(eq(product.id, productId))
    .limit(1);

   if (!current) return [null, null];

   if (current.quantity <= STOCK_THRESHOLDS[0]) {
    await publishEvent({
     event_type: EventType.LOW_STOCK_ALERT,
     payload: {
      productId,
      productName: current.name,
      quantity: current.quantity,
      merchantId: current.merchantId,
     },
    });
   }

   return [null, null];
  } catch (err) {
   return [null, APIError.internalServer("Failed to check low stock")];
  }
 };

 @Transactional()
 async updateProductThreshold(
  productId: string,
  orderId: string,
  action: "placeOrder" | "cancelOrder",
 ): Promise<Result<T<"product">, AppError>> {
  try {
   const [productThreshold, err] = await this.checkProductThreshold(productId);

   if (err || !productThreshold) return [null, err];

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

   if (ItemQuantityPurchased.quantityPurchased <= 0)
    return [
     null,
     APIError.badRequest("This product was not part of the original order."),
    ];

   let updatedProduct: T<"product">;

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
   } else {
    return [null, null];
   }

   await this.checkLowStock(productId);
   await this.checkUserStockAtIntervals(productId);

   return [updatedProduct, null];
  } catch (err) {
   return [
    null,
    APIError.internalServer(
     err instanceof Error ? err.message : "Unknown error",
    ),
   ];
  }
 }
}

export default new InventoryService();
