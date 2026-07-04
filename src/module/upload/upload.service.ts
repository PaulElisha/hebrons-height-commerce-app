/** @format */

import cloudinary from "@app/cloudinary.ts";
import Env from "env.ts";

export interface UploadResult {
 public_id: string;
 url: string;
 folder: string;
 signature: string;
 timestamp: number;
 cloudName: string;
 apiKey: string;
}

class UploadService {
 generateUploadSignature = async (
  folder: "product_images" | "avatar" | "product_videos",
 ): Promise<UploadResult> => {
  const publicId = createPublicId(folder);
  const signature = await cloudinary.utils.api_sign_request(
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
   folder: `${folder}/${publicId}`,
   url: `https://api.cloudinary.com/v1_1/${Env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
   timestamp: Math.floor(Date.now() / 1000),
   cloudName: Env.CLOUDINARY_CLOUD_NAME,
   apiKey: Env.CLOUDINARY_KEY,
  };
 };
}

export default new UploadService();

function createPublicId(
 folder: "product_images" | "avatar" | "product_videos",
) {
 return folder + Date.now() + Math.random().toString(36).substring(2, 15);
}
