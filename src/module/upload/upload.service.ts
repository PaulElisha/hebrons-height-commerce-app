/** @format */
import cloudinary from "@app/cloudinary.ts";
import logger from "@app/logger.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { createPublicId } from "@shared/helper.ts";
import { AssetTypeEnum, Result } from "@shared/types.ts";
import Env from "env.ts";
import { z } from "zod";

export interface UploadResult {
 asset_id: string;
 public_id: string;
 version: number;
 version_id: string;
 signature: string;
 width: number;
 height: number;
 format: string;
 resource_type: string;
 created_at: string;
 tags: string[];
 bytes: number;
 type: string;
 etag: string;
 placeholder: boolean;
 url: string;
 secure_url: string;
 access_mode: string;
 original_filename: string;
}

export const UploadDataSchema = z.object({
 file: z.string(),
 folder: AssetTypeEnum,
});
export type UploadData = z.infer<typeof UploadDataSchema>;

class UploadService {
 uploadImage = async (
  userId: string,
  body: UploadData,
 ): Promise<Result<UploadResult, AppError>> => {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = createPublicId(body.folder, userId);
  const notification_url =
   "https://hebrons-height-commerce-app.onrender.com/api/webhook/cloudinary";
  let signature;

  try {
   signature = cloudinary.utils.api_sign_request(
    {
     timestamp: timestamp.toString(),
     folder: body.folder,
     public_id: publicId,
     unique_filename: "false",
     overwrite: "true",
     tags: "upload",
     context: "alt=upload",
     notification_url,
    },
    Env.CLOUDINARY_SECRET,
   );
  } catch (error) {
   const message = error instanceof Error ? error.message : String(error);
   logger.error({ err: message }, "Upload error");
   return [null, APIError.internalServer(message)];
  }

  const formData = new FormData();

  formData.append("file", body.file);
  formData.append("folder", body.folder);
  formData.append("public_id", publicId);
  formData.append("unique_filename", "false");
  formData.append("overwrite", "true");
  formData.append("tags", "upload");
  formData.append("context", "alt=upload");
  formData.append("timestamp", timestamp.toString());
  formData.append("api_key", Env.CLOUDINARY_KEY);
  formData.append("signature", signature);
  formData.append("notification_url", notification_url);

  try {
   const response = await fetch(
    `https://api.cloudinary.com/v1_1/${Env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
     method: "POST",
     body: formData,
    },
   );

   if (!response.ok) {
    const errorData = await response.json().catch((e) => e);
    logger.error("Cloudinary API rejected upload", errorData);
    return [
     null,
     APIError.internalServer(errorData.error?.message || "Upload rejected"),
    ];
   }

   const data = (await response.json()) as UploadResult;
   return [data, null];
  } catch (error) {
   const message = error instanceof Error ? error.message : String(error);
   return [null, APIError.internalServer(message)];
  }
 };
}

export default new UploadService();
