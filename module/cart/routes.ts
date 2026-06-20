/** @format */

import { api } from "encore.dev/api";
import { eq } from "drizzle-orm";

import { db } from "../../module/auth/db.ts";
import { modifyCart } from "./base.ts";
import { CartActions } from "./dispatcher.ts";
import type {
 AuthData,
 Response,
 TCartAndItem,
 TCartItem,
} from "../../shared/types.ts";
import { getAuth } from "../../shared/get-auth.ts";
import { cart, cartItem } from "../../schema/cart.ts";

interface CartParams {
 productId: string;
}

export const getUserCart = api(
 {
  expose: true,
  auth: true,
  path: "/api/cart",
  method: "GET",
 },
 async (): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();

  const result = await db
   .select()
   .from(cart)
   .leftJoin(cartItem, eq(cart.id, cartItem.cartId))
   .where(eq(cart.userId, authdata?.userID as string));

  if (!result.length) {
   return {
    status: "ok",
    message: "no cart found",
    data: { cart: null, items: [] },
   } as unknown as Response<TCartAndItem>;
  }

  return {
   status: "ok",
   message: "fetched user cart successfully",
   data: {
    cart: result[0].cart,
    items: result.filter((r) => r.cart_items).map((r) => r.cart_items),
   },
  } as unknown as Response<TCartAndItem>;
 },
);

export const addToCart = api(
 {
  expose: true,
  auth: true,
  path: "/api/cart/:productId",
  method: "PUT",
 },
 async (req: CartParams): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();
  const data = await modifyCart(
   authdata?.userID as string,
   req?.productId,
   CartActions.add,
  );

  return {
   status: "ok",
   message: "item added to cart",
   data,
  } as Response<TCartAndItem>;
 },
);

export const removeFromCart = api(
 {
  expose: true,
  auth: true,
  path: "/api/cart/:productId",
  method: "DELETE",
 },
 async (req: CartParams): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();
  const data = await modifyCart(
   authdata?.userID as string,
   req?.productId,
   CartActions.remove,
  );

  return {
   status: "ok",
   message: "item removed from cart",
   data,
  } as Response<TCartAndItem>;
 },
);

export const incrementCartItem = api(
 {
  expose: true,
  auth: true,
  path: "/api/cart/:productId/increment",
  method: "PUT",
 },
 async (req: CartParams): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();
  const data = await modifyCart(
   authdata?.userID as string,
   req?.productId,
   CartActions.increment,
  );

  return {
   status: "ok",
   message: "incremented item in cart",
   data,
  } as Response<TCartAndItem>;
 },
);

export const decrementCartItem = api(
 {
  expose: true,
  auth: true,
  path: "/api/cart/:productId/decrement",
  method: "PUT",
 },
 async (req: CartParams): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();
  const data = await modifyCart(
   authdata?.userID as string,
   req?.productId,
   CartActions.decrement,
  );

  return {
   status: "ok",
   message: "decremented item in cart",
   data,
  } as Response<TCartAndItem>;
 },
);
