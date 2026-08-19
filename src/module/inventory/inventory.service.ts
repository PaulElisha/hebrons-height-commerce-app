/** @format */
import db from "@db/db.ts";
import { cart, cartItem } from "@db/schema/cart.ts";
import { merchant } from "@db/schema/merchant.ts";
import { order, orderItem } from "@db/schema/order.ts";
import { product } from "@db/schema/product.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { STOCK_THRESHOLDS } from "@shared/helper.ts";
import { Result, TProduct, TProductThreshold } from "@shared/types.ts";
import { and, eq, inArray, isNotNull, lt, ne, sql, sum } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
import FA from "fasy";

class InventoryService {
 checkProductThreshold = async (
  productId: string,
 ): Promise<Result<TProductThreshold, AppError>> => {
  const [data] = await db
   .select({ price: product.price, quantity: product.quantity })
   .from(product)
   .where(and(eq(product.id, productId), isNotNull(product.quantity)))
   .limit(1);

  if (!data) return [null, null];

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
      inArray(product.quantity, STOCK_THRESHOLDS),
     ),
    )
    .limit(1);

   if (result.length <= 0) return [null, null];

   const { userId, name, quantity } = result[0];

   await publishEvent({
    event_type: EventType.USERCART_LOW_STOCK_ALERT,
    userId,
    payload: {
     productId,
     productName: name,
     quantity: quantity,
    },
   });

   return [null, null];
  } catch (err) {
   return [null, APIError.internalServer("Failed to check user stock")];
  }
 };

 checkLowStockForMerchant = async (
  productId: string,
 ): Promise<Result<void, AppError>> => {
  try {
   const [current] = await db
    .select({
     quantity: product.quantity,
     name: product.name,
     userId: merchant.userId,
    })
    .from(product)
    .innerJoin(merchant, eq(merchant.id, product.merchantId))
    .where(
     and(
      eq(product.id, productId),
      inArray(product.quantity, STOCK_THRESHOLDS),
     ),
    )
    .limit(1);

   if (!current) return [null, null];

   await publishEvent({
    event_type: EventType.MERCHANT_LOW_STOCK_ALERT,
    userId: current.userId,
    payload: {
     productId,
     productName: current.name,
     quantity: current.quantity,
     userId: current.userId,
    },
   });

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
 ): Promise<Result<TProduct, AppError>> {
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

   let updatedProduct: TProduct;

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

   await this.checkLowStockForMerchant(productId);
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
