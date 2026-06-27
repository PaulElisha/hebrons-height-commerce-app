/** @format */

import { eq } from "drizzle-orm";
import { api } from "encore.dev/api";

import { db } from "../../module/auth/db.ts";
import { cart, cartItem } from "../../schema/cart.ts";
import { getAuth } from "../../shared/get-auth.ts";
import type { AuthData, Response, TCartAndItem } from "../../shared/types.ts";
import { modifyCart } from "./base.ts";

interface CartParams {
 productId: string;
}

export interface Intent {
 userId: string;
 productId: string;
 intent: string;
}

export const getUserCart = api(
 {
  expose: true,
  auth: true,
  path: "/api/cart",
  method: "GET",
  tags: ["role:user"],
 },
 async (): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();

  const result = await db
   .select()
   .from(cart)
   .leftJoin(cartItem, eq(cart.id, cartItem.cartId))
   .where(eq(cart.userId, authdata?.userID as string));

  return {
   status: "ok",
   message: "fetched user cart successfully",
   data: {
    cart: result[0].cart,
    cart_items: result.filter((r) => r.cart_items).map((r) => r.cart_items),
   },
  } as Response<TCartAndItem>;
 },
);

export const addToCart = api(
 {
  expose: true,
  auth: true,
  path: "/api/cart/:productId",
  method: "PUT",
  tags: ["role:user"],
 },
 async (req: CartParams): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();

  const data = await modifyCart({
   userId: authdata?.userID as string,
   productId: req?.productId as string,
   intent: "add",
  });

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
  tags: ["role:user"],
 },
 async (req: CartParams): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();

  const data = await modifyCart({
   userId: authdata?.userID as string,
   productId: req?.productId,
   intent: "remove",
  });

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
  tags: ["role:user"],
 },
 async (req: CartParams): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();

  const data = await modifyCart({
   userId: authdata?.userID as string,
   productId: req?.productId,
   intent: "increment",
  });

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
  tags: ["role:user"],
 },
 async (req: CartParams): Promise<Response<TCartAndItem>> => {
  const [authdata] = getAuth<AuthData>();
  const data = await modifyCart({
   userId: authdata?.userID as string,
   productId: req?.productId,
   intent: "decrement",
  });

  return {
   status: "ok",
   message: "decremented item in cart",
   data,
  } as Response<TCartAndItem>;
 },
);
