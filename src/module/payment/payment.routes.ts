/** @format */

import authenticate from "@shared/middleware/authenticate.ts";
import { Router } from "express";

import PaymentController from "./payment.controller.ts";

class PaymentRoutes {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.post("/initialize/:orderId", PaymentController.initialize);

  this.router.get("/success", async (req, res) => {
   res.send("Payment successful");
  });

  this.router.get("/failed", async (req, res) => {
   res.send("Payment successful");
  });
 }
}

const paymentRoutes = new PaymentRoutes().router;

export default paymentRoutes;
