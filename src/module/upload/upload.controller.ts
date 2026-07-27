/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { APIResponse } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";

import UploadService from "./upload.service.ts";
import type { UploadResult } from "./upload.service.ts";

interface UploadBody {
 folder: "product_images" | "avatar" | "product_videos";
}

class UploadController {
 generateUploadSignature = asyncHandler(
  async (
   req: Request<any, any, UploadBody>,
   res: Response<APIResponse<UploadResult>>,
   next: NextFunction,
  ): Promise<Response | void> => {
   const [uploadResult, err] = await UploadService.generateUploadSignature(
    req.body.folder,
   );

   if (err || !uploadResult) return next(err);

   return res.status(HttpStatus.CREATED).json({
    status: "ok",
    message: "signature created",
    data: uploadResult,
   });
  },
 );
}

export default new UploadController();
