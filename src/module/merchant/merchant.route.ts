/** @format */

import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@middleware/role-guard.ts";
import { Router } from "express";

import MerchantController from "./merchant.controller.ts";
import upload from "@middleware/multer-upload.ts";
import { cloudinaryUploadStream } from "@middleware/cloudinary-upload-stream.ts";

class MerchantRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.router.use(roleGuard("merchant"));
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/profile", MerchantController.getMerchantProfile);
  this.router.post(
   "/",
   upload.single("file"),
   cloudinaryUploadStream("avatar"),
   MerchantController.createMerchantProfile,
  );
  this.router.put("/:merchantId", MerchantController.updateMerchantProfile);
  this.router.delete("/:merchantId", MerchantController.deleteMerchantProfile);
 }
}

const merchantRouter = new MerchantRouter().router;
export default merchantRouter;
