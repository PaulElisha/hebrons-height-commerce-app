/** @format */
import * as APIError from "@shared/error/APIError.ts";
import type { NextFunction, Request, Response } from "express";

const roleGuard = (...roles: Array<string>) => {
 return (req: Request, res: Response, next: NextFunction) => {
  try {
   console.log("User Type: ", req.user.role);
   if (!roles.includes(req.user.role)) {
    throw APIError.forbidden(
     `Forbidden. ${req?.user?.role} is not allowed to access this resource`,
    );
   }
   next();
  } catch (err) {
   next(err);
  }
 };
};

export default roleGuard;
