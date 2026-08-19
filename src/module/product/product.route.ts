/** @format */
import roleGuard from "@middleware/role-guard.ts";
import authenticate from "@shared/middleware/authenticate.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Router } from "express";

import { MerchantParams } from "@module/merchant/merchant.controller.ts";
import ProductController, { ProductParams } from "./product.controller.ts";
import { CreateProductDto, UpdateProductDto } from "./product.service.ts";
import { checkMerchantStatus } from "@shared/middleware/check-status.ts";

class ProductRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/latest", ProductController.getLatestProducts);
  this.router.get(
   "/by-categories",
   roleGuard("user", "merchant"),
   ProductController.getProductsByCategories,
  );
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
   validate(ProductParams, "params"),
   ProductController.getSingleProduct,
  );
  this.router.get(
   "/:merchantId/merchant",
   authenticate,
   roleGuard("user"),
   validate(MerchantParams, "params"),
   ProductController.getProductForMerchant,
  );
  this.router.post(
   "/",
   authenticate,
   roleGuard("merchant"),
   // checkMerchantStatus("approved"),
   validate(CreateProductDto),
   ProductController.createProduct,
  );
  this.router.put(
   "/:productId",
   authenticate,
   roleGuard("merchant"),
   // checkMerchantStatus("approved"),
   validate(UpdateProductDto),
   validate(ProductParams, "params"),
   ProductController.updateProduct,
  );
  this.router.delete(
   "/:productId",
   authenticate,
   roleGuard("merchant"),
   validate(ProductParams, "params"),
   ProductController.deleteProduct,
  );
 }
}

const productRouter = new ProductRouter().router;
export default productRouter;
