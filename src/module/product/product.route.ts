/** @format */

import { Router } from "express";

import ProductController from "./product.controller.ts";
import authenticate from "@shared/middleware/authenticate.ts";

class ProductRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/latest", ProductController.getLatestProducts);
  this.router.get("/", ProductController.getProducts);
  this.router.get(
   "/merchant",
   authenticate,
   ProductController.getMerchantProduct,
  );
  this.router.get(
   "/:productId",
   authenticate,
   ProductController.getSingleProduct,
  );
  this.router.get(
   "/:merchantId/merchant",
   authenticate,
   ProductController.getProductForMerchant,
  );
  this.router.post("/", authenticate, ProductController.createProduct);
  this.router.put("/:productId", authenticate, ProductController.updateProduct);
  this.router.delete(
   "/:productId",
   authenticate,
   ProductController.deleteProduct,
  );
 }
}

const productRouter = new ProductRouter().router;
export default productRouter;
