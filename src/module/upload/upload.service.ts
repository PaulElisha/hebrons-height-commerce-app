/** @format */
import Env from "env.ts";

import cloudinary from "@app/cloudinary.ts";

import { createPublicId } from "@shared/helper.ts";
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
  folder: "product_images" | "avatar" | "product_videos",
 ): Promise<UploadResult> => {
  const publicId = createPublicId(folder);
  const signature = cloudinary.utils.api_sign_request(
   {
    timestamp: Math.floor(Date.now() / 1000),
    folder: `${folder}/${publicId}`,
    public_id: publicId,
    unique_filename: false,
    overwrite: true,
    resource_type: "auto",
    tags: ["upload"],
    context: "alt=upload",
   },
   Env.CLOUDINARY_SECRET,
  );

  return {
   signature,
   public_id: publicId,
   folder: `hhg-${folder}`,
   url: `https://api.cloudinary.com/v1_1/${Env.CLOUDINARY_CLOUD_NAME}/images/upload`,
   timestamp: Math.floor(Date.now() / 1000),
   apiKey: Env.CLOUDINARY_KEY,
  };
 };
}

export default new UploadService();
