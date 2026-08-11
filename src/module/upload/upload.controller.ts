/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import { APIResponse } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";

import UploadService, { UploadData, UploadResult } from "./upload.service.ts";

class UploadController {
 uploadImage = asyncHandler(
  async (
   req: Request<{}, {}, UploadData>,
   res: Response<APIResponse<UploadResult>>,
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
