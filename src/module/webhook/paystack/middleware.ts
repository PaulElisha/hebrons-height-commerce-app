/** @format */

import * as APIError from "@shared/error/APIError.ts";
import crypto from "crypto";
import Env from "env.ts";
import { NextFunction, Request, Response } from "express";

export function parsePaystackBody(
 req: Request,
 _res: Response,
 next: NextFunction,
) {
 try {
  req.rawBody = req.body.toString("utf8");
  req.body = JSON.parse(req.rawBody);
 } catch {
  return next(APIError.badRequest("Invalid JSON payload"));
 }
 next();
}

export const verifyPaystackSignature = async (
 req: Request,
 res: Response,
 next: NextFunction,
) => {
 try {
  const signature = req.headers["x-paystack-signature"];

  if (!signature) {
   return next(APIError.badRequest("Missing Paystack signature"));
  }

  const hash = crypto
   .createHmac("sha512", Env.PAYSTACK_SECRET_KEY)
   .update(req.rawBody)
   .digest("hex");

  if (hash !== signature) {
   return next(
    APIError.badRequest("Invalid Paystack signature verification failed"),
   );
  }

  return next();
 } catch (err) {
  return next(err);
 }
};
