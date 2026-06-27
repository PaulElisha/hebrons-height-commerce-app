/** @format */

import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { NextFunction, Request, Response } from "express";

import OrderService from "./order.service.ts";

class OrderController {
 placeOrder = asyncHandler(
  async (
   req: Request<{ cartId: string }>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const cartId = req.params.cartId;
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
   res: Response,
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
   req: Request<{ orderId: string }>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const orderId = req.params.orderId;

   const data = await OrderService.getOrderDetails(userId, orderId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched order details",
    data,
   });
  },
 );

 getMerchantOrders = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
   req: Request<{ orderId: string }>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const orderId = req.params.orderId;
   await OrderService.cancelOrder(orderId);

   return res.status(HttpStatus.NO_CONTENT).json({
    status: "ok",
    message: "order cancelled",
   });
  },
 );
}
export default new OrderController();
