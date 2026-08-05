/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { APIResponse, AssetType } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";

import UploadService from "./upload.service.ts";
import type { UploadData, UploadResult } from "./upload.service.ts";
import * as APIError from "@shared/error/APIError.ts";

export interface UploadBody {
 folder: AssetType;
}

class UploadController {
 uploadImage = asyncHandler(
  async (
   req: Request<any, any, UploadData>,
   res: Response<APIResponse<any>>,
   next: NextFunction,
  ) => {
   const [data, err] = await UploadService.uploadImage(req.user.id, req.body);

   if (err || !data) return next(err);

   return res.status(HttpStatus.CREATED).json({
    status: "ok",
    message: "image uploaded successfully",
    data,
   });
  },
 );
}

export default new UploadController();
