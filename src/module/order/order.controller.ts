/** @format */
import { CartParams } from "@module/cart/cart.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import {
 APIResponse,
 Pagination,
 TMerchantPaginatedOrders,
 TOrder,
 TOrderAndItems,
 TUserOrderWithItems,
} from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import OrderService, {
 CreateOrderDto,
 TOrderFilter,
 TOrderStatusQuery,
 UpdateOrderStatusDto,
} from "./order.service.ts";

export const OrderParams = z.object({
 orderId: z.string(),
});

class OrderController {
 placeOrder = asyncHandler(
  async (
   req: Request<z.infer<typeof CartParams>, {}, z.infer<typeof CreateOrderDto>>,
   res: Response<APIResponse<{ orderId: string | null }>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const cartId = req.params.cartId;
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
   req: Request<{}, {}, {}, Pagination & TOrderStatusQuery>,
   res: Response<APIResponse<TUserOrderWithItems[]>>,
   next: NextFunction,
  ) => {
    const userId = req.user.id;
    const { status, pageSize, pageNumber } = req.query;

    const [data, err] = await OrderService.getUserOrderByStatus(userId, status, {
     pageSize,
     pageNumber,
    });

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched order status",
    data,
   });
  },
 );

 getOrderDetails = asyncHandler(
  async (
   req: Request<z.infer<typeof OrderParams>>,
   res: Response<APIResponse<TOrderAndItems>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const orderId = req.params.orderId;

   const [data, err] = await OrderService.getOrderDetails(userId, orderId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched order details",
    data,
   });
  },
 );

 getMerchantOrders = asyncHandler(
  async (
   req: Request<{}, {}, {}, Pagination & TOrderFilter>,
   res: Response<APIResponse<TMerchantPaginatedOrders>>,
   next: NextFunction,
  ) => {
    const userId = req.user.id;
    const { status, pageSize, pageNumber } = req.query;

    const [data, err] = await OrderService.getMerchantOrders(
     userId,
     { status },
     { pageSize, pageNumber },
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
   req: Request<z.infer<typeof OrderParams>, {}, z.infer<typeof UpdateOrderStatusDto>>,
   res: Response<APIResponse<TOrder>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const orderId = req.params.orderId;
   const { status } = req.body;

   const [data, err] = await OrderService.updateOrderStatus(
    userId,
    orderId,
    status,
   );
   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: `order ${status.replace("_", " ")}`,
    data,
   });
  },
 );

 cancelOrder = asyncHandler(
  async (
   req: Request<z.infer<typeof OrderParams>>,
   res: Response<APIResponse<TOrder>>,
   next: NextFunction,
  ) => {
   const orderId = req.params.orderId;
   const [data, err] = await OrderService.cancelOrder(orderId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "order cancelled",
    data,
   });
  },
 );
}
export default new OrderController();
