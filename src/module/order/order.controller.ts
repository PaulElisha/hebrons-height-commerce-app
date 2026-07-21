/** @format */
import { CartParams } from "@module/cart/cart.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import {
 APIResponse,
 Pagination,
 TOrder,
 TOrderAndItems,
 TOrderItems,
 TOrderJoinRow,
} from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import OrderService, {
 CreateOrderDto,
 TOrderStatusQuery,
 TOrderFilter,
} from "./order.service.ts";

export interface OrderParams {
 orderId?: string;
}

class OrderController {
 placeOrder = asyncHandler(
  async (
   req: Request<CartParams, any, z.infer<typeof CreateOrderDto>>,
   res: Response<APIResponse<object>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const cartId = String(req.params.cartId);
   const body = req.body;

   const [orderId, err] = await OrderService.placeOrder(userId, cartId, body);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "order placed",
    data: {
     orderId,
    },
   });
  },
 );

 getUserOrderByStatus = asyncHandler(
  async (
   req: Request<{}, {}, {}, TOrderStatusQuery>,
   res: Response<APIResponse<TOrderJoinRow[]>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const status = req.query.status;

   const [data, err] = await OrderService.getUserOrderByStatus(userId, status);

   if (err || !data) return next(err);

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
   const orderId = String(req.params.orderId);

   const [data, err] = await OrderService.getOrderDetails(userId, orderId);

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched order details",
    data,
   });
  },
 );

 getMerchantOrders = asyncHandler(
  async (
   req: Request<any, any, any, Pagination & TOrderFilter>,
   res: Response<APIResponse<TOrderAndItems & any>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;

   const pageSizeValue = Number(req.query.pageSize);
   const pageNumberValue = Number(req.query.pageNumber);

   const pagination = {
    pageSize: Number.isFinite(pageSizeValue) ? pageSizeValue : undefined,
    pageNumber: Number.isFinite(pageNumberValue) ? pageNumberValue : undefined,
   };

   const filters = {
    status: req.query.status,
   };

   const [data, err] = await OrderService.getMerchantOrders(
    userId,
    filters,
    pagination,
   );

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchant orders fetched successfully",
    data,
   });
  },
 );

 updateOrderStatus = asyncHandler(
  async (
   req: Request<OrderParams, {}, { status: "out_for_delivery" | "delivered" }>,
   res: Response<APIResponse<TOrder>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const orderId = String(req.params.orderId);
   const { status } = req.body;

   const [data, err] = await OrderService.updateOrderStatus(
    userId,
    orderId,
    status,
   );
   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: `order ${status.replace("_", " ")}`,
    data,
   });
  },
 );

 cancelOrder = asyncHandler(
  async (
   req: Request<OrderParams>,
   res: Response<APIResponse<TOrder>>,
   next: NextFunction,
  ): Promise<any> => {
   const orderId = String(req.params.orderId);
   const [data, err] = await OrderService.cancelOrder(orderId);

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "order cancelled",
    data,
   });
  },
 );

 deleteOrderItem = asyncHandler(
  async (req: Request<OrderParams>, res: Response, next: NextFunction) => {
   const orderId = String(req.params.orderId);

   const [, err] = await OrderService.deleteOrderItem(orderId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "order deleted",
   });
  },
 );
}
export default new OrderController();
