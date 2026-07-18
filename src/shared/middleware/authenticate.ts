/** @format */
import { auth } from "@auth/auth.ts";
import UnauthorizedExceptionError from "@error/unauthorized.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";

const authenticate = async (
 req: Request,
 res: Response,
 next: NextFunction,
) => {
 try {
  const session = await auth.api.getSession({
   headers: fromNodeHeaders(req.headers),
  });

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
  } catch (err) {
   next(err);
 }
};

export default authenticate;
