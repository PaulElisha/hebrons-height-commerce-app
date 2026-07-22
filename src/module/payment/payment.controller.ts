/** @format */

import { OrderParams } from "@module/order/order.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { APIResponse } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import PaymentService, { CheckoutData } from "./payment.service.ts";

class PaymentController {
 initialize = asyncHandler(
  async (
   req: Request<OrderParams, {}, z.infer<typeof CheckoutData>>,
   res: Response<APIResponse<any>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const orderId = String(req.params.orderId);
   const body = req.body;

   const [paymentRes, err] = await PaymentService.fetchPaymentForOrderByRail(
    userId,
    orderId,
    {
     ...body,
     metadata: {
      orderId,
     },
    },
   );

   if (err || !paymentRes) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "Checkout session created successfully",
    data: paymentRes,
   });
  },
 );
}

export default new PaymentController();
