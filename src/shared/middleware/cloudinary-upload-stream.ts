/** @format */

import cloudinary from "@app/cloudinary.ts";
import { createPublicId } from "@shared/helper.ts";
import { AssetType } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import streamifier from "streamifier";

export const cloudinaryUploadStream = (folder: AssetType) => {
 return (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
   return next(new Error("No file uploaded"));
  }

  try {
   const publicId = createPublicId(folder);
   const stream = cloudinary.uploader.upload_stream(
    {
     folder: folder,
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
  } catch (error) {
   next(error);
  }
 };
};
