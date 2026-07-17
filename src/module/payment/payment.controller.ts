/** @format */

import { NextFunction, Request, Response } from "express";
import Stripe from "stripe";
import z from "zod";

import db from "@db/db.ts";

import { OrderParams } from "@module/order/order.controller.ts";

import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { APIResponse } from "@shared/types.ts";

import { payment } from "@schema/payment.ts";

import PaymentService, {
 CheckoutData,
 PaymentData,
} from "./payment.service.ts";
class PaymentController {
 initialize = asyncHandler(
  async (
   req: Request<OrderParams, {}, z.infer<typeof CheckoutData>>,
   res: Response<APIResponse<any>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const orderId = req.params.orderId as string;
   const body = req.body;

   const [paymentRes, e] = await PaymentService.fetchPaymentForOrderByRail(
    userId,
    orderId,
    {
     ...body,
     metadata: {
      orderId,
     },
    },
   );

   if (e || !paymentRes) return next(e);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "Checkout session created successfully",
    data: paymentRes,
   });
  },
 );

 // verifyPaystack = asyncHandler(
 //  async (
 //   req: Request<any, any, any, { reference: string }>,
 //   res: Response,
 //   next: NextFunction,
 //  ) => {
 //   const reference = req.query.reference;

 //   const [data, e] = await PaymentService.verifyPaystack(reference);

 //   if (e) return next(e);

 //   return res.status(HttpStatus.NO_CONTENT).send({
 //    status: "ok",
 //    message: "Payment verified",
 //    data,
 //   });
 //  },
 // );
}

export default new PaymentController();
