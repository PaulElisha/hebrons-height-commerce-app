/** @format */

import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { NextFunction, Request, Response } from "express";

import {
 createMerchantProfile,
 deleteMerchantProfile,
 getMerchantProfile,
 updateMerchantProfile,
} from "./merchant.service.ts";

class MerchantController {
 getMerchantProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
   const userId = req.user.id;
   const data = await getMerchantProfile(userId);

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

   const data = await createMerchantProfile(userId, body);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchant profile created",
    data,
   });
  },
 );

 updateMerchantProfile = asyncHandler(
  async (
   req: Request<{ merchantId: string }>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const merchantId = req.params.merchantId;
   const body = req.body;

   const data = await updateMerchantProfile(userId, merchantId, body);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchant profile updated",
    data,
   });
  },
 );

 deleteMerchantProfile = asyncHandler(
  async (
   req: Request<{ merchantId: string }>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const merchantId = req.params.merchantId;

   await deleteMerchantProfile(userId, merchantId);

   return res.status(HttpStatus.NO_CONTENT).json({
    status: "ok",
    message: "merchant profile deleted",
   });
  },
 );
}

export default new MerchantController();
