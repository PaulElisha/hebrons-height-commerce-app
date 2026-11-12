/** @format */

import { OrderParams } from "@module/order/order.controller.ts";
import logger from "@app/logger.ts";
import HttpStatus from "@shared/enum/http.ts";
import * as APIError from "@shared/error/APIError.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { APIResponse } from "@shared/types.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import WebHookHandler from "@webhook/handler/payment.handler.ts";
import { CheckoutSessionResponse } from "@bachs/sdk";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import PaymentService, {
 CheckoutData,
 PaymentResponseData,
 VerifyPaymentParams,
} from "./payment.service.ts";

class PaymentController {
 initialize = asyncHandler(
  async (
   req: Request<z.infer<typeof OrderParams>, {}, z.infer<typeof CheckoutData>>,
   res: Response<APIResponse<PaymentResponseData>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const orderId = req.params.orderId;
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

   const [, initErr] = await WebHookHandler.handlePaymentInitialized(
    userId,
    orderId,
    paymentRes,
   );

   if (initErr) return next(initErr);

   try {
    await publishEvent({
     event_type: EventType.PAYMENT_INITIALIZED,
     payload: { userId, orderId, paymentResponseData: paymentRes },
    });
   } catch (notifyErr) {
    logger.error(
     { err: notifyErr, orderId },
     "[...Payment initialized notification failed]",
    );
   }

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "Checkout session created successfully",
    data: paymentRes,
   });
  },
 );

 verify = asyncHandler(
  async (
   req: Request<z.infer<typeof VerifyPaymentParams>, {}, {}>,
   res: Response<APIResponse<CheckoutSessionResponse>>,
   next: NextFunction,
  ) => {
   const reference = req.params.reference;

   if (!reference) return next(APIError.badRequest("Reference is required"));

   const [data, err] = await PaymentService.verifyPayment(reference);

   if (err || !data) return next(err);

   if (data.status === "completed") {
    const orderId =
     (data.metadata?.orderId as string | undefined) ?? "";

    const paidAt = data.completed_at
     ? new Date(data.completed_at)
     : new Date();

    const [, verifyErr] = await WebHookHandler.handleBachsPaymentVerified(
     {
      event: "checkout.completed",
      reference,
      amount: 0,
      paid_at: paidAt,
     },
     orderId,
    );

    if (verifyErr) return next(verifyErr);
   }

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "Payment verified successfully",
    data,
   });
  },
 );
}

export default new PaymentController();
