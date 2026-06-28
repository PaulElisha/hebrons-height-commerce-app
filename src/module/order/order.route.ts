/** @format */

import OrderController from "@module/order/order.controller.ts";
import authenticate from "@middleware/authenticate.ts";
import { Router } from "express";
import { auth } from "@auth/auth.ts";

class OrderRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/merchant", OrderController.getMerchantOrders);
  this.router.get("/status", OrderController.getUserOrderByStatus);
  this.router.get("/:orderId", OrderController.getOrderDetails);
  this.router.post("/:cartId", OrderController.placeOrder);
  this.router.put("/:orderId", OrderController.cancelOrder);
 }
}

const orderRouter = new OrderRouter().router;
export default orderRouter;
