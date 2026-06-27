/** @format */
import HttpStatus from "@enum/http.ts";
import asyncHandler from "@middleware/async-handler.ts";
import CartService from "@module/cart/cart.service.ts";
import { APIResponse, TCartAndItem } from "@shared/types.ts";
import type { NextFunction, Request, Response } from "express";

interface CartParams {
 productId: string;
}

class CartController {
 addToCart = asyncHandler(
  async (
   req: Request<CartParams>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const productId = req.params.productId;

   const data = await CartService.addToCart(userId, productId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product added to cart",
    data,
   } as APIResponse<TCartAndItem>);
  },
 );

 removeFromCart = asyncHandler(
  async (
   req: Request<CartParams>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const productId = req.params.productId;

   const data = await CartService.removeFromCart(userId, productId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product removed from cart",
    data,
   } as APIResponse<TCartAndItem>);
  },
 );

 incrementCartItem = asyncHandler(
  async (
   req: Request<CartParams>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const productId = req.params.productId;

   const data = await CartService.incrementItem(userId, productId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product quantity incremented",
    data,
   }) as Response<TCartAndItem>;
  },
 );

 decrementCartItem = asyncHandler(
  async (
   req: Request<CartParams>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const productId = req.params.productId;

   const data = await CartService.decrementItem(userId, productId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product quantity decremented",
    data,
   }) as Response<TCartAndItem>;
  },
 );

 getUserCart = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
   const userId = req.user.id;

   const data = CartService.getUserCart(userId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "user cart fetched successfully",
    data,
   }) as Response<TCartAndItem>;
  },
 );
}

export default new CartController();
