/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import {
 APIResponse,
 TAnalyticsResult,
 TMerchant,
 TMerchantWithUser,
} from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import MerchantService, {
 CreateMerchantDto,
 UpdateMerchantDto,
} from "./merchant.service.ts";

export const MerchantParams = z.object({
 merchantId: z.string(),
});

class MerchantController {
 getMerchantProfile = asyncHandler(
  async (
   req: Request,
   res: Response<APIResponse<TMerchantWithUser>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const [data, err] = await MerchantService.getMerchantProfile(userId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched merchant profile",
    data: data ?? undefined,
   });
  },
 );

 createMerchantProfile = asyncHandler(
  async (
   req: Request<{}, {}, z.infer<typeof CreateMerchantDto>>,
   res: Response<APIResponse<TMerchant>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const body = req.body;

   const [data, err] = await MerchantService.createMerchantProfile(
    userId,
    body,
   );

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchant profile created",
    data,
   });
  },
 );

 updateMerchantProfile = asyncHandler(
  async (
   req: Request<
    z.infer<typeof MerchantParams>,
    {},
    z.infer<typeof UpdateMerchantDto>
   >,
   res: Response<APIResponse<TMerchant>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const merchantId = req.params.merchantId;
   const body = req.body;

   const [data, err] = await MerchantService.updateMerchantProfile(
    userId,
    merchantId,
    body,
   );

   if (err) return next(err);

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
   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "analytics fetched successfully",
    data,
   });
  },
 );

 deleteMerchantProfile = asyncHandler(
  async (
   req: Request<z.infer<typeof MerchantParams>>,
   res: Response,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const merchantId = req.params.merchantId;

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
