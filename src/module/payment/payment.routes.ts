/** @format */
import stripeClient from "@app/stripe.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import authenticate from "@shared/middleware/authenticate.ts";
import roleGuard from "@shared/middleware/role-guard.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Request, Response, Router } from "express";
import z from "zod";

import PaymentController from "./payment.controller.ts";
import { CheckoutData, VerifyPaymentParams } from "./payment.service.ts";
import { OrderParams } from "@module/order/order.controller.ts";

const StripeSessionQuery = z.object({
 session_id: z.string(),
});

class PaymentRoutes {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.router.use(roleGuard("user"));
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get(
   "/success",
   asyncHandler(
    async (
     req: Request<{}, {}, {}, z.infer<typeof StripeSessionQuery>>,
     res: Response,
    ) => {
     const session = await stripeClient.checkout.sessions.retrieve(
      req.query.session_id,
     );
     res.send(`${session.customer_details?.name}`);
    },
   ),
  );

  this.router.get("/cancel", (_req, res) => {
   res.send("Payment failed");
  });

  this.router.get(
   "/verify/:reference",
   validate(VerifyPaymentParams, "params"),
   PaymentController.verify,
  );

  this.router.post(
   "/initialize/:orderId",
   validate(OrderParams, "params"),
   validate(CheckoutData),
   PaymentController.initialize,
  );
 }
}

const paymentRoutes = new PaymentRoutes().router;

export default paymentRoutes;
