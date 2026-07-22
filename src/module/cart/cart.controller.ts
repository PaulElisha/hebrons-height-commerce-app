/** @format */
import HttpStatus from "@enum/http.ts";
import asyncHandler from "@middleware/async-handler.ts";
import CartService from "@module/cart/cart.service.ts";
import { ProductParams } from "@module/product/product.controller.ts";
import { APIResponse, TCartAndItem } from "@shared/types.ts";
import type { NextFunction, Request, RequestHandler, Response } from "express";

export interface CartParams extends RequestHandler {
 cartId: string;
}

class CartController {
 addToCart = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId;

   const [data, err] = await CartService.addToCart(userId, productId);

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product added to cart",
    data,
   });
  },
 );

 removeFromCart = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId;

   const [data, err] = await CartService.removeFromCart(userId, productId);

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product removed from cart",
    data,
   });
  },
 );

 incrementCartItem = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId;

   const [data, err] = await CartService.incrementItem(userId, productId);

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product quantity incremented",
    data,
   });
  },
 );

 decrementCartItem = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId;

   const [data, err] = await CartService.decrementItem(userId, productId);

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product quantity decremented",
    data,
   });
  },
 );

 getUserCart = asyncHandler(
  async (
   req: Request<CartParams>,
   res: Response<APIResponse<TCartAndItem>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const cartId = String(req.params.cartId);

   const [data, err] = await CartService.getUserCart(userId, cartId);

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "user cart fetched successfully",
    data,
   });
  },
 );
}

export default new CartController();
