/** @format */
import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@shared/middleware/role-guard.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Router } from "express";

import UploadController from "./upload.controller.ts";
import { UploadDataSchema } from "./upload.service.ts";

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
  validate(UploadDataSchema),
  UploadController.uploadImage,
 );
 }
}

const uploadRouter = new UploadRouter().router;
export default uploadRouter;
