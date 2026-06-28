/** @format */

import db from "@db/db.ts";
import ErrorCode from "@enum/error-code.ts";
import HttpStatus from "@enum/http.ts";
import AppError from "@error/app-error.ts";
import InternalServerError from "@error/internal-server.ts";
import NotFoundException from "@error/not-found.ts";
import { cart, cartItem } from "@schema/cart.ts";
import { product } from "@schema/product.ts";
import * as helper from "@shared/helper.ts";
import { Result, type Transaction } from "@shared/types.ts";
import { and, eq, isNotNull, sql } from "drizzle-orm";

import CartActions from "./dispatcher.ts";

interface Intent {
 userId: string;
 productId: string;
 intent: string;
}

class CartBase {
 calculateTotalAmount =
  (tx: Transaction) => async (cartId: string, userId: string) => {
   const [result] = await tx
    .select({
     subtotal: sql<number>`COALESCE(SUM(${cartItem.totalItemPrice}), 0)`,
    })
    .from(cartItem)
    .where(and(eq(cartItem.cartId, cartId), isNotNull(cartItem.id)));

   await tx
    .update(cart)
    .set({
     subtotal: result.subtotal,
    })
    .where(and(eq(cart.id, cartId), eq(cart.userId, userId)));
  };

 modifyCart = async (userIntent: Intent) => {
  const { userId, productId, intent } = userIntent;
  return await db.transaction(async (tx: Transaction) => {
   let [userCart] = await tx
    .select()
    .from(cart)
    .where(eq(cart.userId, userId))
    .limit(1);

   if (!userCart) {
    [userCart] = await tx.insert(cart).values({ userId }).returning();
   }

   const callback = CartActions[intent];

   if (typeof intent === "string" && intent == "add") {
    const existingItem = await helper.checkItemExistsInCart(tx)(
     userCart.id,
     productId,
    );

    if (existingItem)
     return {
      cart: userCart,
      cart_items: [existingItem],
     };

    const [price, e] = await this.checkInventoryThreshold(tx, productId);

    if (e) throw e;

    await callback(tx)(userCart.id, productId, Number(price));
   } else if (typeof intent === "string" && intent == "increment") {
    const existingItem = await helper.checkItemExistsInCart(tx)(
     userCart.id,
     productId,
    );

    if (existingItem) {
     const [price, e] = await this.checkInventoryThreshold(tx, productId);

     if (e) throw e;
    }

    await callback(tx)(userCart.id, productId);
   } else {
    await callback(tx)(userCart.id, productId);
   }

   await this.calculateTotalAmount(tx)(userCart.id, userId);

   return await helper.getCartAndItems(tx)(userCart.id, userId);
  });
 };

 async checkInventoryThreshold(
  tx: Transaction,
  productId: string,
 ): Promise<Result<number, AppError>> {
  const [{ price, quantity: threshold }] = await tx
   .select({ price: product.price, quantity: product.quantity })
   .from(product)
   .where(and(eq(product.id, productId), isNotNull(product.quantity)))
   .limit(1);

  if (threshold <= 0)
   return [
    null,
    new NotFoundException(
     "Product is out of stock",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];

  const currentAllocatedQuantity = await helper.getProductAllocatedQuantity(
   tx,
   productId,
  );

  const currentAllocatedCount = currentAllocatedQuantity?.totalQuantity
   ? Number(currentAllocatedQuantity?.totalQuantity)
   : 0;

  if (currentAllocatedCount + 1 > threshold)
   return [
    null,
    new InternalServerError(
     "Product threshold exceeded",
     HttpStatus.UNPROCESSABLE_ENTITY,
     ErrorCode.INTERNAL_SERVER_ERROR,
    ),
   ];

  return [price, null];
 }
}

export default new CartBase();
