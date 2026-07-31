/** @format */
import db from "@db/db.ts";
import authenticate from "@middleware/authenticate.ts";
import { user } from "@schema/auth.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { cloudinaryUploadStream } from "@shared/middleware/cloudinary-upload-stream.ts";
import upload from "@shared/middleware/multer-upload.ts";
import roleGuard from "@shared/middleware/role-guard.ts";
import { APIResponse, T } from "@shared/types.ts";
import { and, eq, isNotNull } from "drizzle-orm";
import { Request, Response, Router } from "express";

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
   asyncHandler(async (req: Request, res: Response<APIResponse<T<"user">>>) => {
    const user = req.user;
    res.json({
     status: "ok",
     message: "user profile fetched successfully",
     data: user,
    });
   }),
  );

  this.router.put(
   "/update",
   asyncHandler(async (req: Request, res: Response<APIResponse<T<"user">>>) => {
    const body = req.body;
    const userId = req.user.id;

    const updateData: Record<string, any> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;

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
   }),
  );
 }
}

const userRouter = new UserRouter().router;
export default userRouter;
