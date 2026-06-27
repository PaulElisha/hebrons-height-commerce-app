/** @format */

import OrderController from "@module/order/order.controller.ts";
import { Router } from "express";

class OrderRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.post("/", OrderController.placeOrder);
  this.router.get("/status", OrderController.getUserOrderByStatus);
  this.router.get("/:orderId", OrderController.getOrderDetails);
  this.router.get("/merchant", OrderController.getMerchantOrders);
  this.router.delete("/", OrderController.cancelOrder);
 }
}

const orderRouter = new OrderRouter().router;
export default orderRouter;
