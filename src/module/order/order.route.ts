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
  this.initializeRoutes();
 }

 initializeRoutes() {
  const userRoutes = Router();
  userRoutes.use(roleGuard("user"));
  userRoutes.get("/status", OrderController.getUserOrderByStatus);
  userRoutes.get("/:orderId", OrderController.getOrderDetails);
  userRoutes.post(
   "/:cartId",
   validate(CreateOrderDto),
   OrderController.placeOrder,
  );
  userRoutes.put("/:orderId", OrderController.cancelOrder);
  userRoutes.delete("/:orderId", OrderController.deleteOrderItem);
  this.router.use(userRoutes);

  const merchantRoutes = Router();
  merchantRoutes.use(roleGuard("merchant"));
  merchantRoutes.get("/merchant", OrderController.getMerchantOrders);
  merchantRoutes.put("/:orderId/status", OrderController.updateOrderStatus);
  this.router.use(merchantRoutes);
 }
}

const orderRouter = new OrderRouter().router;
export default orderRouter;
