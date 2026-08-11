/** @format */
import * as helper from "@shared/helper.ts";
import { Result, TCartAndItem } from "@shared/types.ts";
import AppError from "@shared/error/app-error.ts";

import CartBase from "./base.ts";

class CartService {
 addToCart = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "add",
  });
 };

 removeFromCart = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "remove",
  });
 };

 incrementItem = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "increment",
  });
 };

 decrementItem = async (
  userId: string,
  productId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  return await CartBase.modifyCart({
   userId,
   productId,
   intent: "decrement",
  });
 };

 getUserCart = async (
  userId: string,
  cartId: string,
 ): Promise<Result<TCartAndItem, AppError>> => {
  return await helper.getCartAndItems(cartId, userId);
 };
}

export default new CartService();
