/** @format */
import { and, eq, isNotNull } from "drizzle-orm";
import { Request, Response, Router } from "express";

import db from "@db/db.ts";

import authenticate from "@middleware/authenticate.ts";
import HttpStatus from "@shared/enum/http.ts";
import { cloudinaryUploadStream } from "@shared/middleware/cloudinary-upload-stream.ts";
import upload from "@shared/middleware/multer-upload.ts";
import roleGuard from "@shared/middleware/role-guard.ts";
import { APIResponse, TUser } from "@shared/types.ts";

import { user } from "@schema/auth.ts";
class UserRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.router.use(roleGuard("user", "merchant"));
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get(
   "/profile",
   async (req: Request, res: Response<APIResponse<TUser>>) => {
    const user = req.user;
    res.json({
     status: "ok",
     message: "user profile fetched successfully",
     data: user,
    });
   },
  );

  this.router.put(
   "/update",
   upload.single("file"),
   cloudinaryUploadStream("avatar"),
   async (req: Request, res: Response<APIResponse<TUser>>) => {
    const body = req.body;
    const userId = req.user.id;
    const image = req.upload_image.url;

    const updateData: { [k: string]: any } = {};

    updateData.name = body.name && body.name;
    updateData.email = body.email && body.email;
    updateData.image = image && image;
    updateData.updatedAt = new Date();

    const [updatedUser] = await db
     .update(user)
     .set(updateData)
     .where(and(eq(user.id, userId), isNotNull(user.id)))
     .returning();

    return res.status(HttpStatus.OK).json({
     status: "ok",
     message: "user profile updated successfully",
     data: updatedUser,
    });
   },
  );
 }
}

const userRouter = new UserRouter().router;
export default userRouter;
