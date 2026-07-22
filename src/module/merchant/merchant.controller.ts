/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import {
 APIResponse,
 TAnalyticsResult,
 TMerchant,
 TMerchantWithUser,
} from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import MerchantService, { UpdateMerchantDto } from "./merchant.service.ts";

export interface MerchantParams {
 merchantId?: string;
}

export const CreateMerchantSchema = z.object({
 businessName: z.string(),
 businessDescription: z.string(),
 address: z.string(),
});

class MerchantController {
 getMerchantProfile = asyncHandler(
  async (
   req: Request,
   res: Response<APIResponse<TMerchantWithUser>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const [data, err] = await MerchantService.getMerchantProfile(userId);

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched merchant profile",
    data: data ?? undefined,
   });
  },
 );

 createMerchantProfile = asyncHandler(
  async (
   req: Request<any, any, z.infer<typeof CreateMerchantSchema>>,
   res: Response<APIResponse<TMerchant>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const body = req.body;
   const businessLogo = req.upload_image.url;

   const [data, err] = await MerchantService.createMerchantProfile(userId, {
    ...body,
    businessLogo,
   });

   if (err || !data) return next(err);

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
   res: Response<APIResponse<TMerchant>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const merchantId = String(req.params.merchantId);
   const body = req.body;

   const [data, err] = await MerchantService.updateMerchantProfile(
    userId,
    merchantId,
    body,
   );

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchant profile updated",
    data,
   });
  },
 );

 getAnalytics = asyncHandler(
  async (
   req: Request,
   res: Response<APIResponse<TAnalyticsResult>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const [data, err] = await MerchantService.getAnalytics(userId);
   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "analytics fetched successfully",
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
   const merchantId = String(req.params.merchantId);

   const [, err] = await MerchantService.deleteMerchantProfile(
    userId,
    merchantId,
   );

   if (err) return next(err);

   return res.status(HttpStatus.NO_CONTENT).send();
  },
 );
}

export default new MerchantController();
