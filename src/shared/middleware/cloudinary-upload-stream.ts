/** @format */

import cloudinary from "@app/cloudinary.ts";
import { createPublicId } from "@shared/helper.ts";
import streamifier from "streamifier";
import { Request, Response, NextFunction } from "express";
import { AssetType } from "./cloudinary-upload-bulk-stream.ts";

export const cloudinaryUploadStream = (folder: AssetType) => {
 return (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
   return next(new Error("No file uploaded"));
  }

  const publicId = createPublicId(folder);
  const stream = cloudinary.uploader.upload_stream(
   {
    folder: folder,
    public_id: publicId,
    resource_type: "auto",
   },
   (err: any, data: any) => {
    if (!err)
     req.cloudinaryResult = { url: data.secure_url, publicId: data.public_id };

    next();
   },
  );
  streamifier.createReadStream(req.file.buffer).pipe(stream);
 };
};
