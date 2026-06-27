/** @format */

import { Router } from "express";

import ProductController from "./product.controller.ts";

class ProductRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/merchant", ProductController.getMerchantProduct);
  this.router.get("/:productId", ProductController.getSingleProduct);
  this.router.get("/:merchantId", ProductController.getProductForMerchant);
  this.router.get("/latest", ProductController.getLatestProducts);
  this.router.get("/", ProductController.getProducts);
  this.router.post("/", ProductController.createProduct);
  this.router.put("/update", ProductController.updateProduct);
  this.router.delete("/", ProductController.deleteProduct);
 }
}

const productRouter = new ProductRouter().router;
export default productRouter;
