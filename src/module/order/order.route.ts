/** @format */
import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@middleware/role-guard.ts";
import OrderController from "@module/order/order.controller.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Router } from "express";

import { CreateOrderDto } from "./order.service.ts";

class OrderRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.router.use(roleGuard("user"));
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/merchant", OrderController.getMerchantOrders);
  this.router.get("/status", OrderController.getUserOrderByStatus);
  this.router.get("/:orderId", OrderController.getOrderDetails);
  this.router.post(
   "/:cartId",
   validate(CreateOrderDto),
   OrderController.placeOrder,
  );
  this.router.put("/:orderId", OrderController.cancelOrder);
  this.router.delete("/:orderId", OrderController.deleteOrderItem);
 }
}

const orderRouter = new OrderRouter().router;
export default orderRouter;
