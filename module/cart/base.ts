/** @format */
import { sql, eq, and, isNotNull, sum } from "drizzle-orm";
import { Mutex } from "async-mutex";

import { db } from "../auth/db.ts";
import { cartItem, cart } from "../../schema/cart.ts";
import { Result, type Transaction } from "../../shared/types.ts";
import * as helper from "../../shared/helper.ts";
import { product } from "../../schema/product.ts";
import { Intent } from "./routes.ts";
import { APIError } from "encore.dev/api";

const mutex = new Mutex();

const calculateTotalAmount =
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

export const modifyCart = async (userIntent: Intent) => {
 const { userId, productId, intent, actions } = userIntent;
 return await mutex.runExclusive(async () => {
  return await db.transaction(async (tx: Transaction) => {
   let [userCart] = await tx
    .select()
    .from(cart)
    .where(eq(cart.userId, userId))
    .limit(1);

   if (!userCart) {
    [userCart] = await tx.insert(cart).values({ userId }).returning();
   }

   const callback = actions[intent];

   if (typeof intent === "string" && intent == "add") {
    const [price, e] = await checkInventoryThreshold(tx, productId);

    if (e) throw e;

    await callback(tx)(userCart.id, productId, Number(price));
   } else if (typeof intent === "string" && intent == "increment") {
    const [price, e] = await checkInventoryThreshold(tx, productId);

    if (e) throw e;

    await callback(tx)(userCart.id, productId);
   } else {
    await callback(tx)(userCart.id, productId);
   }

   await calculateTotalAmount(tx)(userCart.id, userId);

   return await helper.getCartAndItems(tx)(userCart.id, userId);
  });
 });
};

async function checkInventoryThreshold(
 tx: Transaction,
 productId: string,
): Promise<Result<number, APIError>> {
 const [{ price, quantity: threshold }] = await tx
  .select({ price: product.price, quantity: product.quantity })
  .from(product)
  .where(and(eq(product.id, productId), isNotNull(product.quantity)))
  .limit(1);

 if (threshold <= 0)
  return [null, APIError.unavailable("Product is out of stock")];

 const currentAllocatedQuantity = await helper.getProductAllocatedQuantity(
  tx,
  productId,
 );

 const currentAllocatedCount = currentAllocatedQuantity?.totalQuantity
  ? Number(currentAllocatedQuantity?.totalQuantity)
  : 0;

 if (currentAllocatedCount + 1 > threshold)
  return [null, APIError.outOfRange("product threshold exceeded")];

 return [price, null];
}
