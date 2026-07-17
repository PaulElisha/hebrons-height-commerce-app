/** @format */
import { Router } from "express";

import authenticate from "@shared/middleware/authenticate.ts";
import roleGuard from "@shared/middleware/role-guard.ts";
import { validate } from "@shared/middleware/validate.ts";

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
  this.router.get("/success", async (req, res) => {
   res.send("Payment successful");
  });

  this.router.get("/failed", async (req, res) => {
   res.send("Payment failed");
  });

  // this.router.get("/paystack/verify", PaymentController.verifyPaystack);

  this.router.post(
   "/initialize/:orderId",
   validate(CheckoutData),
   PaymentController.initialize,
  );
 }
}

const paymentRoutes = new PaymentRoutes().router;

export default paymentRoutes;
