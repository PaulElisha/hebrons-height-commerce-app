/** @format */

import cloudinary from "@app/cloudinary.ts";
import { createPublicId } from "@shared/helper.ts";
import { AssetType } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import FA from "fasy";
import streamifier from "streamifier";

export const cloudinaryUploadBulkStream = (folder: AssetType) => {
 return async (req: Request, res: Response, next: NextFunction) => {
  try {
   const targetFiles = req.files;

   if (!targetFiles || targetFiles.length === 0) {
    return next(new Error("No files uploaded under the 'gallery' field key."));
   }

   const results = await FA.concurrent.map(async (file: any) => {
    return new Promise((res, rej) => {
     const publicId = createPublicId(folder);

     const streams = cloudinary.uploader.upload_stream(
      {
       folder: folder,
       public_id: publicId,
       resource_type: "auto",
      },
      (err: any, data: any) => {
       if (err) return rej(err);
       res({ url: data.secure_url, publicId: data.public_id });
      },
     );
     streamifier.createReadStream(file.buffer).pipe(streams);
    });
   }, targetFiles);

   req.upload_images = results;

   next();
  } catch (error) {
   next(error);
  }
 };
};
