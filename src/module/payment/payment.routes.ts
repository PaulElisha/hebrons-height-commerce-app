/** @format */
import { OrderParams } from "@module/order/order.controller.ts";
import authenticate from "@shared/middleware/authenticate.ts";
import roleGuard from "@shared/middleware/role-guard.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Router } from "express";

import PaymentController from "./payment.controller.ts";
import { CheckoutData, VerifyPaymentParams } from "./payment.service.ts";

class PaymentRoutes {
 router: Router;
 constructor() {
  this.router = Router();
  this.initializeCallbackRoutes();
  this.router.use(authenticate);
  this.router.use(roleGuard("user"));
  this.initializeRoutes();
 }

 initializeCallbackRoutes() {
  this.router.get("/success", (_req, res) => {
   res.send("Payment successful");
  });

  this.router.get("/cancel", (_req, res) => {
   res.send("Payment failed");
  });
 }

 initializeRoutes() {
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
