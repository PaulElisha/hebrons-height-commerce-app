/** @format */

import { OrderParams } from "@module/order/order.controller.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { APIResponse } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import Stripe from "stripe";

import PaymentService, {
 CheckoutData,
 PaymentData,
} from "./payment.service.ts";
import { payment } from "@schema/payment.ts";
import db from "@db/db.ts";
import HttpStatus from "@shared/enum/http.ts";
import z from "zod";

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

   const [data, e] = await PaymentService.initialize(userId, orderId, body);

   if (e) return next(e);

   const paymentData = {
    rail: data?.rail,
    email: data?.email,
    currency: data?.currency,
    callback_url: data?.callbackUrl,
    mode: data?.mode as Stripe.Checkout.SessionCreateParams.Mode,
    metadata: {
     orderId,
    },
   };

   const [checkoutUrl, err] = await PaymentService.fetchPaymentForOrderByRail(
    userId,
    orderId,
    paymentData as PaymentData,
   );

   if (err) return next(err);

   res.redirect(checkoutUrl);
  },
 );

 verifyPaystack = asyncHandler(
  async (
   req: Request<any, any, any, { reference: string }>,
   res: Response,
   next: NextFunction,
  ) => {
   const reference = req.query.reference;

   const [data, e] = await PaymentService.verifyPaystack(reference);

   if (e) return next(e);

   return res.status(HttpStatus.NO_CONTENT).send({
    status: "ok",
    message: "Payment verified",
   });
  },
 );
}

export default new PaymentController();
