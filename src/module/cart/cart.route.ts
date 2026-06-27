/** @format */

import { Router } from "express";

import CartController from "./cart.controller.ts";

class CartRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/user", CartController.getUserCart);
  this.router.put("/:productId", CartController.addToCart);
  this.router.put("/:productId/increment", CartController.incrementCartItem);
  this.router.put("/:productId/decrement", CartController.decrementCartItem);
  this.router.delete("/:productId", CartController.removeFromCart);
 }
}

const cartRouter = new CartRouter().router;
export default cartRouter;
