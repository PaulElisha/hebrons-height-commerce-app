/** @format */
import db from "@db/db.ts";
import InventoryService from "@module/inventory/inventory.service.ts";
import { cart, cartItem } from "@db/schema/cart.ts";
import AppError from "@shared/error/app-error.ts";
import * as APIError from "@shared/error/APIError.ts";
import * as helper from "@shared/helper.ts";
import { Result, TCartAndItem } from "@shared/types.ts";
import { Mutex } from "async-mutex";
import { and, eq, sql } from "drizzle-orm";
import { Transactional } from "drizzle-transactional";

import CartActions from "./dispatcher.ts";

const mutex = new Mutex();

interface Intent {
 userId: string;
 productId: string;
 intent: string;
}

class CartBase {
 @Transactional()
 async calculateTotalAmount(cartId: string, userId: string) {
  const [result] = await db
   .select({
    subtotal: sql<number>`COALESCE(SUM(${cartItem.totalItemPrice}), 0)`,
   })
   .from(cartItem)
   .where(eq(cartItem.cartId, cartId));

  await db
   .update(cart)
   .set({
    subtotal: result.subtotal,
   })
   .where(and(eq(cart.id, cartId), eq(cart.userId, userId)));
 }

 @Transactional()
 async modifyCart(userIntent: Intent): Promise<Result<TCartAndItem, AppError>> {
  const { userId, productId, intent } = userIntent;

  let [userCart] = await db
   .select()
   .from(cart)
   .where(eq(cart.userId, userId))
   .limit(1);

  if (!userCart) {
   [userCart] = await db.insert(cart).values({ userId }).returning();
  }

  const callback = CartActions[intent];

  if (!callback)
   return [null, APIError.badRequest(`invalid cart action: ${intent}`)];

  const [result, err] = await mutex.runExclusive(async () => {
   if (intent == "add") {
    const existingItem = await helper.checkItemExistsInCart(
     userCart.id,
     productId,
    );

    if (existingItem) return await helper.getCartAndItems(userCart.id, userId);

    const [price, err] =
     await InventoryService.checkInventoryThreshold(productId);

    if (err || !price) return [null, err];

    const [, actionErr] = await callback(
     userCart.id,
     userId,
     productId,
     Number(price),
    );
    if (actionErr) return [null, actionErr];
   } else if (intent == "increment") {
    const existingItem = await helper.checkItemExistsInCart(
     userCart.id,
     productId,
    );

    if (existingItem) {
     const [price, err] =
      await InventoryService.checkInventoryThreshold(productId);

     if (err || !price) return [null, err];
    }

    const [, actionErr] = await callback(userCart.id, userId, productId);
    if (actionErr) return [null, actionErr];
   } else {
    const [, actionErr] = await callback(userCart.id, userId, productId);
    if (actionErr) return [null, actionErr];
   }

   return [null, null];
  });

  if (err) return [null, err];
  if (result) return [result, null];

  await this.calculateTotalAmount(userCart.id, userId);

  const [cartData, cartErr] = await helper.getCartAndItems(userCart.id, userId);
  if (cartErr || !cartData) return [null, cartErr];
  return [cartData, null];
 }
}

export default new CartBase();
