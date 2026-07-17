/** @format */

import { auth } from "@auth/auth.ts";
import { UploadImage, UploadImages } from "@shared/types.ts";

type Session = typeof auth.$Infer.Session;

declare global {
 namespace Express {
  interface Request {
   user: Session["user"];
   session: Session["session"];

   upload_image: UploadImage;

   upload_images: UploadImages;

   file: Express.Multer.File;
   files: Express.Multer.File[];

   rawBody: string;
  }
 }
}
