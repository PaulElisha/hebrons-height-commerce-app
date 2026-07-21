/** @format */
import authenticate from "@middleware/authenticate.ts";
import { cloudinaryUploadStream } from "@middleware/cloudinary-upload-stream.ts";
import upload from "@middleware/multer-upload.ts";
import roleGuard from "@middleware/role-guard.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Router } from "express";

import MerchantController from "./merchant.controller.ts";
import { UpdateMerchantDto } from "./merchant.service.ts";

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
  this.router.get("/analytics", MerchantController.getAnalytics);
  this.router.post(
   "/",
   // validate(CreateMerchantDto),
   upload.single("file"),
   cloudinaryUploadStream("avatar"),
   MerchantController.createMerchantProfile,
  );
  this.router.put(
   "/:merchantId",
   validate(UpdateMerchantDto),
   MerchantController.updateMerchantProfile,
  );
  this.router.delete("/:merchantId", MerchantController.deleteMerchantProfile);
 }
}

const merchantRouter = new MerchantRouter().router;
export default merchantRouter;
