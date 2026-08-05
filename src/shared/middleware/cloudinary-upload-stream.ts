/** @format */
import cloudinary from "@app/cloudinary.ts";
import * as APIError from "@shared/error/APIError.ts";
import { createPublicId } from "@shared/helper.ts";
import { AssetType } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import streamifier from "streamifier";

const ASSET_TYPES: AssetType[] = ["profile", "product", "business", "additional"];

export const cloudinaryUploadStream = (folder?: AssetType) => {
 return (req: Request, res: Response, next: NextFunction) => {
  const targetFolder: AssetType | undefined =
   folder ?? (req.body.folder as AssetType | undefined);

  if (!targetFolder) {
   return next(APIError.badRequest("folder is required"));
  }

  if (!ASSET_TYPES.includes(targetFolder)) {
   return next(
    APIError.badRequest(
     "folder must be one of: profile, product, business, additional",
    ),
   );
  }

  if (!req.file) {
   return next(APIError.badRequest("No file uploaded"));
  }

  try {
   const publicId = createPublicId(targetFolder, req.user.id);
   const stream = cloudinary.uploader.upload_stream(
    {
     folder: targetFolder,
     public_id: publicId,
     resource_type: "auto",
    },
    (err: any, data: any) => {
     if (err) {
      return next(err);
     }

     req.upload_image = {
      url: data.secure_url,
      publicId: data.public_id,
     };

     next();
    },
   );
   streamifier.createReadStream(req.file.buffer).pipe(stream);
  } catch (err) {
   next(err);
  }
 };
};
