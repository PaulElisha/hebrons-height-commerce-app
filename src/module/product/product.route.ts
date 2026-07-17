/** @format */
import { Router } from "express";

import roleGuard from "@middleware/role-guard.ts";
import authenticate from "@shared/middleware/authenticate.ts";
import { cloudinaryUploadBulkStream } from "@shared/middleware/cloudinary-upload-bulk-stream.ts";
import { cloudinaryUploadStream } from "@shared/middleware/cloudinary-upload-stream.ts";
import upload from "@shared/middleware/multer-upload.ts";
import { validate } from "@shared/middleware/validate.ts";

import ProductController from "./product.controller.ts";
import { CreateProductDto, UpdateProductDto } from "./product.service.ts";
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
   validate(CreateProductDto),
   upload.single("file"),
   cloudinaryUploadStream("product_images"),
   ProductController.createProduct,
  );
  this.router.put(
   "/additional-images/:productId",
   authenticate,
   roleGuard("merchant"),
   upload.array("files", 5),
   cloudinaryUploadBulkStream("additional_images"),
   ProductController.uploadAdditionalMediaForProduct,
  );
  this.router.put(
   "/:productId",
   authenticate,
   roleGuard("merchant"),
   validate(UpdateProductDto),
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
