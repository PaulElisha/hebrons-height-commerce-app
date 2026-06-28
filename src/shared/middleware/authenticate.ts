/** @format */

import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";

import { auth } from "@auth/auth.ts";
import UnauthorizedExceptionError from "@error/unauthorized.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";

const authenticate = async (
 req: Request,
 res: Response,
 next: NextFunction,
) => {
 try {
  console.log("Headers passing to Auth:", req.headers);

  const session = await auth.api.getSession({
   headers: fromNodeHeaders(req.headers),
  });

  console.log("Better Auth Session Output:", session);

  if (!session) {
   throw new UnauthorizedExceptionError(
    "Unauthorized, Please sign in",
    HttpStatus.UNAUTHORIZED,
    ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
   );
  }

  req.user = session.user;
  req.session = session.session;

  next();
 } catch (error) {
  next(error);
 }
};

export default authenticate;
