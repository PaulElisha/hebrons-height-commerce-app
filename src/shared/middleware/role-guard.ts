/** @format */
import type { NextFunction, Request, Response } from "express";

import ErrorCode from "@enum/error-code.ts";
import HttpStatus from "@enum/http.ts";
import UnauthorizedExceptionError from "@error/unauthorized.ts";
const roleGuard = (...roles: Array<string>) => {
 return (req: Request, res: Response, next: NextFunction) => {
  try {
   console.log("User Type: ", req.user.role);
   if (!roles.includes(req.user.role)) {
    throw new UnauthorizedExceptionError(
     `Forbidden. ${req?.user?.role} is not allowed to access this resource`,
     HttpStatus.FORBIDDEN,
     ErrorCode.ACCESS_UNAUTHORIZED,
    );
   }
   next();
  } catch (error) {
   next(error);
  }
 };
};

export default roleGuard;
