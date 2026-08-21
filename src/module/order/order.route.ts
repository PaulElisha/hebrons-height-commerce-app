/** @format */
import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@middleware/role-guard.ts";
import { CartParams } from "@module/cart/cart.controller.ts";
import OrderController, { OrderParams } from "@module/order/order.controller.ts";
import { validate } from "@shared/middleware/validate.ts";
import { PaginationSchema } from "@shared/types.ts";
import { Router } from "express";

import {
 CreateOrderDto,
 OrderFilter,
 OrderStatusQuery,
 UpdateOrderStatusDto,
} from "./order.service.ts";

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
   validate(PaginationSchema, "query"),
   validate(OrderFilter, "query"),
   OrderController.getMerchantOrders,
  );
  this.router.put(
   "/:orderId/status",
   roleGuard("merchant"),
   validate(UpdateOrderStatusDto),
   validate(OrderParams, "params"),
   OrderController.updateOrderStatus,
  );

  this.router.get(
   "/status",
   roleGuard("user"),
   validate(PaginationSchema, "query"),
   validate(OrderStatusQuery, "query"),
   OrderController.getUserOrderByStatus,
  );
  this.router.get(
   "/:orderId",
   roleGuard("user"),
   validate(OrderParams, "params"),
   OrderController.getOrderDetails,
  );
  this.router.post(
   "/:cartId",
   roleGuard("user"),
   validate(CartParams, "params"),
   validate(CreateOrderDto),
   OrderController.placeOrder,
  );
  this.router.put(
   "/:orderId",
   roleGuard("user"),
   validate(OrderParams, "params"),
   OrderController.cancelOrder,
  );
 }
}

const orderRouter = new OrderRouter().router;
export default orderRouter;
