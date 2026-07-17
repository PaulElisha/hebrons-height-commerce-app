/** @format */

import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import Env from "env.ts";
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";

export const verifyPaystackSignature = async (
 req: Request,
 res: Response,
 next: NextFunction,
) => {
 try {
  const signature = req.headers["x-paystack-signature"];

  if (!signature) {
   next(
    new BadRequestException(
     "Missing Paystack signature",
     HttpStatus.BAD_REQUEST,
     ErrorCode.VALIDATION_ERROR,
    ),
   );
  }

  const hash = crypto
   .createHmac("sha512", Env.PAYSTACK_SECRET_KEY)
   .update(req.rawBody)
   .digest("hex");

  if (hash !== signature) {
   next(
    new BadRequestException(
     "Invalid Paystack signature verification failed",
     HttpStatus.BAD_REQUEST,
     ErrorCode.AUTH_UNAUTHORIZED_ACCESS,
    ),
   );
  }

  next();
 } catch (error) {
  next(error);
 }
};
