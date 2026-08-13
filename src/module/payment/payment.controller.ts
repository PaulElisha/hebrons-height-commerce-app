/** @format */

import { OrderParams } from "@module/order/order.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import * as APIError from "@shared/error/APIError.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import { APIResponse } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import PaymentService, {
 CheckoutData,
 PaymentCheckoutResult,
 PaystackVerifiedData,
} from "./payment.service.ts";

class PaymentController {
 initialize = asyncHandler(
  async (
   req: Request<OrderParams, {}, z.infer<typeof CheckoutData>>,
   res: Response<APIResponse<PaymentCheckoutResult>>,
   next: NextFunction,
  ) => {
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

 verify = asyncHandler(
  async (
   req: Request<{}, {}, {}, { reference: string }>,
   res: Response<APIResponse<PaystackVerifiedData>>,
   next: NextFunction,
  ) => {
   const reference = req.query.reference;

   if (!reference) return next(APIError.badRequest("Reference is required"));

   const [data, err] = await PaymentService.verifyPayment(reference);

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "Payment verified successfully",
    data,
   });
  },
 );
}

export default new PaymentController();
