/** @format */
import authenticate from "@shared/middleware/authenticate.ts";
import roleGuard from "@shared/middleware/role-guard.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Router } from "express";

import PaymentController from "./payment.controller.ts";
import { CheckoutData } from "./payment.service.ts";

class PaymentRoutes {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.router.use(roleGuard("user"));
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/success", (_req, res) => {
   res.send("Payment successful");
  });

  this.router.get("/failed", (_req, res) => {
   res.send("Payment failed");
  });

  this.router.post(
   "/initialize/:orderId",
   validate(CheckoutData),
   PaymentController.initialize,
  );
 }
}

const paymentRoutes = new PaymentRoutes().router;

export default paymentRoutes;
