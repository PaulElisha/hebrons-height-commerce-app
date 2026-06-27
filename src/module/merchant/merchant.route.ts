/** @format */

import { Router } from "express";

import MerchantController from "./merchant.controller.ts";

const merchantRouter = Router();

merchantRouter.get("/profile", MerchantController.getMerchantProfile);
merchantRouter.post("/", MerchantController.createMerchantProfile);
merchantRouter.put("/:merchantId", MerchantController.updateMerchantProfile);
merchantRouter.delete("/:merchantId", MerchantController.deleteMerchantProfile);

export default merchantRouter;
