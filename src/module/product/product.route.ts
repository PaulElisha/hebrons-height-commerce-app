/** @format */

import roleGuard from "@middleware/role-guard.ts";
import authenticate from "@shared/middleware/authenticate.ts";
import { Request, Router } from "express";

import ProductController from "./product.controller.ts";

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
   roleGuard("merchant"),
   ProductController.getMerchantProduct,
  );
  this.router.get(
   "/:productId",
   authenticate,
   roleGuard("user"),
   ProductController.getSingleProduct,
  );
  this.router.get(
   "/:merchantId/merchant",
   authenticate,
   roleGuard("user"),
   ProductController.getProductForMerchant,
  );
  this.router.post(
   "/",
   authenticate,
   roleGuard("merchant"),
   ProductController.createProduct,
  );
  this.router.put(
   "/:productId",
   authenticate,
   roleGuard("merchant"),
   ProductController.updateProduct,
  );
  this.router.delete(
   "/:productId",
   authenticate,
   roleGuard("merchant"),
   ProductController.deleteProduct,
  );
 }
}

const productRouter = new ProductRouter().router;
export default productRouter;
