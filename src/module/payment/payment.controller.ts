/** @format */

import { OrderParams } from "@module/order/order.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { APIResponse } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";

import PaymentService from "./payment.service.ts";

class PaymentController {
 initialize = asyncHandler(
  async (
   req: Request<OrderParams>,
   res: Response<APIResponse<any>>,
   next: NextFunction,
  ): Promise<Response> => {
   const userId = req.user.id;
   const orderId = req.params.orderId as string;
   const body = req.body;

   const data = await PaymentService.initialize(userId, orderId, body);

   const checkoutUrl = await PaymentService.fetchPaymentForOrderByRail(
    userId,
    orderId,
    body,
   );

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "payment initialized",
    data: {
     payment: data,
     checkoutUrl,
    },
   } as APIResponse<any>);
  },
 );
}

export default new PaymentController();
