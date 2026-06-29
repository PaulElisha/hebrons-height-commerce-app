/** @format */

import { CartParams } from "@module/cart/cart.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import {
 APIResponse,
 Pagination,
 TOrder,
 TOrderAndItems,
} from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";

import OrderService from "./order.service.ts";

export interface OrderParams {
 orderId?: string;
}

class OrderController {
 placeOrder = asyncHandler(
  async (
   req: Request<CartParams>,
   res: Response<APIResponse<string>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const cartId = req.params.cartId as string;
   const body = req.body;

   const data = await OrderService.placeOrder(userId, cartId, body);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "order placed",
    data,
   });
  },
 );

 getUserOrderByStatus = asyncHandler(
  async (
   req: Request<{}, {}, {}, { status: string }>,
   res: Response<APIResponse<TOrderAndItems>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const status = req.query.status;

   const data = await OrderService.getUserOrderByStatus(userId, status);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched order status",
    data,
   });
  },
 );

 getOrderDetails = asyncHandler(
  async (
   req: Request<OrderParams>,
   res: Response<APIResponse<TOrderAndItems>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const orderId = req.params.orderId as string;

   const data = await OrderService.getOrderDetails(userId, orderId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched order details",
    data,
   });
  },
 );

 getMerchantOrders = asyncHandler(
  async (
   req: Request<any, any, any, Pagination>,
   res: Response<APIResponse<TOrderAndItems>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;

   const pageSizeValue = Number(req.query.pageSize);
   const pageNumberValue = Number(req.query.pageNumber);

   const pagination = {
    pageSize: Number.isFinite(pageSizeValue) ? pageSizeValue : undefined,
    pageNumber: Number.isFinite(pageNumberValue) ? pageNumberValue : undefined,
   };

   const data = await OrderService.getMerchantOrders(userId, pagination);
  },
 );

 cancelOrder = asyncHandler(
  async (
   req: Request<OrderParams>,
   res: Response<APIResponse<TOrder>>,
   next: NextFunction,
  ): Promise<any> => {
   const orderId = req.params.orderId as string;
   const data = await OrderService.cancelOrder(orderId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "order cancelled",
    data,
   });
  },
 );
}
export default new OrderController();
