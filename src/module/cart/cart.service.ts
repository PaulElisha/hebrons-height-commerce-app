/** @format */
import { getCartAndItems } from "@shared/helper.ts";
import { Result, TCartAndItem } from "@shared/types.ts";

import CartBase from "./base.ts";

class CartService {
 addToCart = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "add",
  });
 };

 removeFromCart = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "remove",
  });
 };

 incrementItem = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "increment",
  });
 };

 decrementItem = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "decrement",
  });
 };

 getUserCart = async (
  userId: string,
  cartId: string,
 ): Promise<Result<TCartAndItem>> => {
  return await getCartAndItems(cartId, userId);
 };
}

export default new CartService();
