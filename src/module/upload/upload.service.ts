/** @format */
import cloudinary from "@app/cloudinary.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { createPublicId } from "@shared/helper.ts";
import { AssetType, Result } from "@shared/types.ts";
import Env from "env.ts";

import { UploadBody } from "./upload.controller.ts";
import logger from "@app/logger.ts";

export interface UploadResult {
 public_id: string;
 url: string;
 folder: string;
 signature: string;
 timestamp: number;
 apiKey: string;
}

export interface UploadData {
 file: any;
 folder: AssetType;
}

class UploadService {
 // generateUploadSignature = async (
 //  body: UploadBody,
 //  userId: string,
 // ): Promise<Result<UploadResult, AppError>> => {
 //  try {
 //   const timestamp = Math.floor(Date.now() / 1000);
 //   const publicId = createPublicId(body.folder, userId);
 //   const signature = cloudinary.utils.api_sign_request(
 //    {
 //     timestamp,
 //     folder: `${body.folder}/${publicId}`,
 //     public_id: publicId,
 //     unique_filename: false,
 //     overwrite: true,
 //     resource_type: "auto",
 //     tags: ["upload"],
 //     context: "alt=upload",
 //    },
 //    Env.CLOUDINARY_SECRET,
 //   );

 //   return [
 //    {
 //     signature,
 //     public_id: publicId,
 //     folder: body.folder,
 //     url: `https://api.cloudinary.com/v1_1/${Env.CLOUDINARY_CLOUD_NAME}/image/upload`,
 //     timestamp,
 //     apiKey: Env.CLOUDINARY_KEY,
 //    },
 //    null,
 //   ];
 //  } catch (err) {
 //   return [
 //    null,
 //    APIError.internalServer("Failed to generate upload signature"),
 //   ];
 //  }
 // };

 uploadImage = async (
  userId: string,
  body: UploadData,
 ): Promise<Result<any, AppError>> => {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = createPublicId(body.folder, userId);
  let signature;

  try {
   signature = cloudinary.utils.api_sign_request(
    {
     timestamp,
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
  } catch (error: any) {
   logger.error("Upload error", error);
   return [null, error];
  }

  try {
   const response = await fetch(
    `https://api.cloudinary.com/v1_1/${Env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
     method: "POST",
     body: {
      file: body.file,
      folder: body.folder,
      publicId,
      unique_filename: "false",
      timestamp,
      api_key: Env.CLOUDINARY_KEY,
      signature,
     } as any,
    },
   );
   const data = await response.json();
   return [data, null];
  } catch (error: any) {
   return [null, error];
  }
 };
}

export default new UploadService();
