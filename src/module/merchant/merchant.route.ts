/** @format */

import { Router } from "express";

import MerchantController from "./merchant.controller.ts";
import authenticate from "@middleware/authenticate.ts";

class MerchantRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/profile", MerchantController.getMerchantProfile);
  this.router.post("/", MerchantController.createMerchantProfile);
  this.router.put("/:merchantId", MerchantController.updateMerchantProfile);
  this.router.delete("/:merchantId", MerchantController.deleteMerchantProfile);
 }
}

const merchantRouter = new MerchantRouter().router;
export default merchantRouter;
