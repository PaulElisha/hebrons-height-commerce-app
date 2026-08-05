/** @format */
import authenticate from "@middleware/authenticate.ts";
import upload from "@shared/middleware/multer-upload.ts";
import roleGuard from "@shared/middleware/role-guard.ts";
import { Router } from "express";

import UploadController from "./upload.controller.ts";

class UploadRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.router.use(roleGuard("user", "merchant"));
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.post(
   "/upload-image",
   upload.single("file"),
   UploadController.uploadImage,
  );
 }
}

const uploadRouter = new UploadRouter().router;
export default uploadRouter;
