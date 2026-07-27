/** @format */
import db from "@db/db.ts";
import InventoryService from "@module/inventory/inventory.service.ts";
import { cart, cartItem } from "@schema/cart.ts";
import AppError from "@shared/error/app-error.ts";
import * as APIError from "@shared/error/APIError.ts";
import * as helper from "@shared/helper.ts";
import { Result, TCartAndItem } from "@shared/types.ts";
import { Mutex } from "async-mutex";
import { and, eq, isNotNull, sql } from "drizzle-orm";
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
   .where(and(eq(cartItem.cartId, cartId), isNotNull(cartItem.id)));

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

  const [result, err] = await mutex.runExclusive(async () => {
   if (typeof intent === "string" && intent == "add") {
    const existingItem = await helper.checkItemExistsInCart(
     userCart.id,
     productId,
    );

    if (existingItem)
     return [{ cart: userCart, cart_items: [existingItem] }, null];

    const [price, err] =
     await InventoryService.checkInventoryThreshold(productId);

    if (err || !price) return [null, err];

    await callback(userCart.id, userId, productId, Number(price));
   } else if (typeof intent === "string" && intent == "increment") {
    const existingItem = await helper.checkItemExistsInCart(
     userCart.id,
     productId,
    );

    if (existingItem) {
     const [price, err] =
      await InventoryService.checkInventoryThreshold(productId);

     if (err || !price) return [null, err];
    }

    await callback(userCart.id, userId, productId);
   } else {
    await callback(userCart.id, userId, productId);
   }

   return [null, null];
  });

  if (err) return [null, err];
  if (result) return [result, null];

  await this.calculateTotalAmount(userCart.id, userId);

  const [cartData, cartErr] = await helper.getCartAndItems(
   userCart.id,
   userId,
  );
  if (cartErr || !cartData) return [null, cartErr];
  return [cartData, null];
 }
}

export default new CartBase();
