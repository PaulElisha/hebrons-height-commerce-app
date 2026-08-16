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
  this.router.get(
   "/merchant",
   roleGuard("merchant"),
   OrderController.getMerchantOrders,
  );
  this.router.put(
   "/:orderId/status",
   roleGuard("merchant"),
   OrderController.updateOrderStatus,
  );

  this.router.get(
   "/status",
   roleGuard("user"),
   OrderController.getUserOrderByStatus,
  );
  this.router.get(
   "/:orderId",
   roleGuard("user"),
   OrderController.getOrderDetails,
  );
  this.router.post(
   "/:cartId",
   roleGuard("user"),
   validate(CreateOrderDto),
   OrderController.placeOrder,
  );
  this.router.put("/:orderId", roleGuard("user"), OrderController.cancelOrder);
 }
}

const orderRouter = new OrderRouter().router;
export default orderRouter;
