/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import MerchantService, { UpdateMerchantDto } from "./merchant.service.ts";

export interface MerchantParams {
 merchantId?: string;
}

class MerchantController {
  getMerchantProfile = asyncHandler(
   async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const userId = req.user.id;
    const [data, error] = await MerchantService.getMerchantProfile(userId);

    if (error) throw error;

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

   const [data, error] = await MerchantService.createMerchantProfile(userId, {
    ...body,
    businessLogo,
   });

   if (error) throw error;

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

   const [data, error] = await MerchantService.updateMerchantProfile(
    userId,
    merchantId,
    body,
   );

   if (error) throw error;

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

   const [, error] = await MerchantService.deleteMerchantProfile(
    userId,
    merchantId,
   );

   if (error) throw error;

   return res.status(HttpStatus.NO_CONTENT).send();
  },
 );
}

export default new MerchantController();
