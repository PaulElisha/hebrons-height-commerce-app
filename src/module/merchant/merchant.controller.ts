/** @format */

import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { NextFunction, Request, Response } from "express";

import MerchantService, {
 CreateMerchantDto,
 UpdateMerchantDto,
} from "./merchant.service.ts";
import z from "zod";

export interface MerchantParams {
 merchantId?: string;
}

class MerchantController {
 getMerchantProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
   const userId = req.user.id;
   const data = await MerchantService.getMerchantProfile(userId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched merchant profile",
    data,
   });
  },
 );

 createMerchantProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
   const userId = req.user.id;
   const body = req.body;
   const businessLogo = req.upload_image.url;

   const data = await MerchantService.createMerchantProfile(userId, {
    ...body,
    businessLogo,
   });

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchant profile created",
    data,
   });
  },
 );

 updateMerchantProfile = asyncHandler(
  async (
   req: Request<MerchantParams, any, any, z.infer<typeof UpdateMerchantDto>>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const merchantId = req.params.merchantId as string;
   const body = req.body;

   const data = await MerchantService.updateMerchantProfile(
    userId,
    merchantId,
    body,
   );

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchant profile updated",
    data,
   });
  },
 );

 deleteMerchantProfile = asyncHandler(
  async (
   req: Request<MerchantParams>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const merchantId = req.params.merchantId as string;

   await MerchantService.deleteMerchantProfile(userId, merchantId);

   return res.status(HttpStatus.NO_CONTENT).json({
    status: "ok",
    message: "merchant profile deleted",
   });
  },
 );
}

export default new MerchantController();
