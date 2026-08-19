/** @format */
import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@middleware/role-guard.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Router } from "express";

import { ProductParams } from "@module/product/product.controller.ts";
import CartController, { CartParams } from "./cart.controller.ts";

class CartRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.router.use(roleGuard("user"));
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get(
   "/:cartId",
   validate(CartParams, "params"),
   CartController.getUserCart,
  );
  this.router.put(
   "/:productId",
   validate(ProductParams, "params"),
   CartController.addToCart,
  );
  this.router.put(
   "/:productId/increment",
   validate(ProductParams, "params"),
   CartController.incrementCartItem,
  );
  this.router.put(
   "/:productId/decrement",
   validate(ProductParams, "params"),
   CartController.decrementCartItem,
  );
  this.router.delete(
   "/:productId",
   validate(ProductParams, "params"),
   CartController.removeFromCart,
  );
 }
}

const cartRouter = new CartRouter().router;
export default cartRouter;
