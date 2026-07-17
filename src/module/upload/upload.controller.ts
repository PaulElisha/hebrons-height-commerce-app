/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { APIResponse } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";

import UploadService, { UploadResult } from "./upload.service.ts";

interface UploadBody {
 folder: "product_images" | "avatar" | "product_videos";
}

class UploadController {
 generateUploadSignature = asyncHandler(
  async (
   req: Request<any, any, UploadBody>,
   res: Response<APIResponse<UploadResult>>,
   next: NextFunction,
  ): Promise<Response> => {
   const uploadResult = await UploadService.generateUploadSignature(
    req.body.folder,
   );

   return res.status(HttpStatus.CREATED).json({
    status: "ok",
    message: "signature created",
    uploadResult,
   } as APIResponse<UploadResult>);
  },
 );
}

export default new UploadController();
