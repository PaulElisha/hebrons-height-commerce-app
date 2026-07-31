/** @format */
import cloudinary from "@app/cloudinary.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { createPublicId } from "@shared/helper.ts";
import { Result } from "@shared/types.ts";
import Env from "env.ts";

import { UploadBody } from "./upload.controller.ts";

export interface UploadResult {
 public_id: string;
 url: string;
 folder: string;
 signature: string;
 timestamp: number;
 apiKey: string;
}

class UploadService {
 generateUploadSignature = async (
  body: UploadBody,
  userId: string,
 ): Promise<Result<UploadResult, AppError>> => {
  try {
   const timestamp = Math.floor(Date.now() / 1000);
   const publicId = createPublicId(body.folder, userId);
   const signature = cloudinary.utils.api_sign_request(
    {
     timestamp: Math.floor(Date.now() / 1000),
     folder: `${body.folder}/${publicId}`,
     public_id: publicId,
     unique_filename: false,
     overwrite: true,
     resource_type: "auto",
     tags: ["upload"],
     context: "alt=upload",
    },
    Env.CLOUDINARY_SECRET,
   );

   return [
    {
     signature,
     public_id: publicId,
     folder: body.folder,
     url: `https://api.cloudinary.com/v1_1/${Env.CLOUDINARY_CLOUD_NAME}/images/upload`,
     timestamp,
     apiKey: Env.CLOUDINARY_KEY,
    },
    null,
   ];
  } catch (err) {
   return [
    null,
    APIError.internalServer("Failed to generate upload signature"),
   ];
  }
 };
}

export default new UploadService();
