/** @format */
import { and, eq, isNotNull, sql } from "drizzle-orm";

import db from "@db/db.ts";

import InventoryService from "@module/inventory/inventory.service.ts";

import * as helper from "@shared/helper.ts";
import { type Transaction } from "@shared/types.ts";

import { cart, cartItem } from "@schema/cart.ts";

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

    const [price, e] = await InventoryService.checkInventoryThreshold(
     tx,
     productId,
    );

    if (e) throw e;

     await callback(tx)(userCart.id, userId, productId, Number(price));
   } else if (typeof intent === "string" && intent == "increment") {
    const existingItem = await helper.checkItemExistsInCart(tx)(
     userCart.id,
     productId,
    );

    if (existingItem) {
     const [price, e] = await InventoryService.checkInventoryThreshold(
      tx,
      productId,
     );

     if (e) throw e;
    }

     await callback(tx)(userCart.id, userId, productId);
    } else {
     await callback(tx)(userCart.id, userId, productId);
   }

   await this.calculateTotalAmount(tx)(userCart.id, userId);

   return await helper.getCartAndItems(tx)(userCart.id, userId);
  });
 };
}

export default new CartBase();
