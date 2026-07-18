/** @format */
import { CartParams } from "@module/cart/cart.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import {
 APIResponse,
 Pagination,
 TOrder,
 TOrderAndItems,
 TOrderJoinRow,
} from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import OrderService, { CreateOrderDto } from "./order.service.ts";

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
   const cartId = req.params.cartId as string;
   const body = req.body;

   const [orderId, e] = await OrderService.placeOrder(userId, cartId, body);

   if (e) return next(e);

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
   req: Request<{}, {}, {}, { status: string }>,
   res: Response<APIResponse<TOrderJoinRow[] | null>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const status = req.query.status;

   const [data, e] = await OrderService.getUserOrderByStatus(userId, status);

   if (e) return next(e);

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
   res: Response<APIResponse<TOrderAndItems | null>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const orderId = req.params.orderId as string;

   const [data, e] = await OrderService.getOrderDetails(userId, orderId);

   if (e) return next(e);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched order details",
    data,
   });
  },
 );

 getMerchantOrders = asyncHandler(
  async (
   req: Request<
    any,
    any,
    any,
    Pagination & {
     status?: string;
    }
   >,
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

   const [data, e] = await OrderService.getMerchantOrders(
    userId,
    filters,
    pagination,
   );

   if (e) return next(e);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchant orders fetched successfully",
    data,
   });
  },
 );

 cancelOrder = asyncHandler(
  async (
   req: Request<OrderParams>,
   res: Response<APIResponse<TOrder | null>>,
   next: NextFunction,
  ): Promise<any> => {
   const orderId = req.params.orderId as string;
   const [data, e] = await OrderService.cancelOrder(orderId);

   if (e) return next(e);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "order cancelled",
    data,
   });
  },
 );

 deleteOrderItem = asyncHandler(
   async (req: Request<OrderParams>, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId as string;

    const [, error] = await OrderService.deleteOrderItem(orderId);

    if (error) return next(error);

    return res.status(HttpStatus.OK).json({
     status: "ok",
     message: "order deleted",
    });
   },
  );
}
export default new OrderController();
