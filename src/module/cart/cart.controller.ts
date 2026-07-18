/** @format */
import HttpStatus from "@enum/http.ts";
import asyncHandler from "@middleware/async-handler.ts";
import CartService from "@module/cart/cart.service.ts";
import { ProductParams } from "@module/product/product.controller.ts";
import { APIResponse, TCartAndItem } from "@shared/types.ts";
import type { NextFunction, Request, Response } from "express";

export interface CartParams {
 cartId?: string;
}

class CartController {
 addToCart = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId as string;

   const [data, error] = await CartService.addToCart(userId, productId);

   if (error) return next(error);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product added to cart",
    data,
   } as APIResponse<TCartAndItem>);
  },
 );

 removeFromCart = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId as string;

   const [data, error] = await CartService.removeFromCart(userId, productId);

   if (error) return next(error);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product removed from cart",
    data,
   } as APIResponse<TCartAndItem>);
  },
 );

 incrementCartItem = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId as string;

   const [data, error] = await CartService.incrementItem(userId, productId);

   if (error) return next(error);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product quantity incremented",
    data,
   } as APIResponse<TCartAndItem>);
  },
 );

 decrementCartItem = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId as string;

   const [data, error] = await CartService.decrementItem(userId, productId);

   if (error) return next(error);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product quantity decremented",
    data,
   } as APIResponse<TCartAndItem>);
  },
 );

 getUserCart = asyncHandler(
  async (
   req: Request<CartParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const cartId = req.params.cartId as string;

   const [data, error] = await CartService.getUserCart(userId, cartId);

   if (error) return next(error);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "user cart fetched successfully",
    data,
   } as APIResponse<TCartAndItem>);
  },
 );
}

export default new CartController();
