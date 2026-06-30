/** @format */

import { OrderParams } from "@module/order/order.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { APIResponse } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";

import PaymentService, {
 CheckoutData,
 PaymentData,
} from "./payment.service.ts";
import InternalServerError from "@shared/error/internal-server.ts";
import ErrorCode from "@shared/enum/error-code.ts";

class PaymentController {
 initialize = asyncHandler(
  async (
   req: Request<OrderParams, {}, CheckoutData>,
   res: Response<APIResponse<any>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const orderId = req.params.orderId as string;
   const body = req.body;

   const data = await PaymentService.initialize(userId, orderId, body);

   if (!data) {
    throw new InternalServerError(
     "Failed to initialize payment",
     HttpStatus.INTERNAL_SERVER_ERROR,
     ErrorCode.INTERNAL_SERVER_ERROR,
    );
   }

   const checkoutUrl = await PaymentService.fetchPaymentForOrderByRail(
    userId,
    orderId,
    data as PaymentData,
   );

   res.redirect(checkoutUrl);
  },
 );
}

export default new PaymentController();
