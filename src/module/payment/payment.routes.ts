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
 }
}

const paymentRoutes = new PaymentRoutes().router;

export default paymentRoutes;
