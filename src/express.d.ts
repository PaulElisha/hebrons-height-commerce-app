/** @format */

import { auth } from "@auth/auth.ts";
import { UploadImages } from "@shared/types.ts";

type Session = typeof auth.$Infer.Session;

declare global {
 namespace Express {
  interface Request {
   user: Session["user"];
   session: Session["session"];

   cloudinaryResult: {
    url: string;
    publicId: string;
   };

   cloudinaryResults: UploadImages;

   file: Express.Multer.File;
   files: Express.Multer.File[];
  }
 }
}
