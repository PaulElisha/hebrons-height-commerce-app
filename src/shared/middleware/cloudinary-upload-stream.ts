/** @format */

// /** @format */

// import cloudinary from "@app/cloudinary.ts";
// import { timestamp } from "drizzle-orm/gel-core";
// import { Request, Response, NextFunction } from "express";

// interface CloudinaryOptions {
//  folder: string;
//  public_id: string;
//  signature: string;
//  apiKey: string;
//  timestamp: string;
// }
// export const cloudinaryUploadStream = (folder: string) => {
//  return (req: Request, res: Response, next: NextFunction) => {
//   const { public_id, signature, apiKey, timestamp } = req.body;

//   const stream = cloudinary.uploader.upload_stream(
//    {
//     folder: folder,
//     timestamp: timestamp,
//     public_id: public_id,
//     signature: signature,
//     api_key: apiKey,
//     unique_filename: false,
//     resource_type: "auto",
//    },
//    (err: Error, data: any) => {
//     if (!err)
//      req.cloudinaryResult = { url: data.secure_url, publicId: data.public_id };

//     next();
//    },
//   );
//   req.pipe(stream);
//  };
// };
