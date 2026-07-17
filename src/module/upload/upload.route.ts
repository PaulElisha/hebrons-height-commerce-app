/** @format */
import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@shared/middleware/role-guard.ts";
import { Router } from "express";

import UploadController from "./upload.controller.ts";

class UploadRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.post(
   "/cloudinary-signature",
   roleGuard("user"),
   UploadController.generateUploadSignature,
  );
 }
}

const uploadRouter = new UploadRouter().router;
export default uploadRouter;
