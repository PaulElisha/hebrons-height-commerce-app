/** @format */

import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@middleware/role-guard.ts";
import { Router } from "express";

import CartController from "./cart.controller.ts";

class CartRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.router.use(roleGuard("user"));
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/:cartId", CartController.getUserCart);
  this.router.put("/:productId", CartController.addToCart);
  this.router.put("/:productId/increment", CartController.incrementCartItem);
  this.router.put("/:productId/decrement", CartController.decrementCartItem);
  this.router.delete("/:productId", CartController.removeFromCart);
 }
}

const cartRouter = new CartRouter().router;
export default cartRouter;
