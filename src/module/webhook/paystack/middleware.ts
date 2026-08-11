/** @format */

import * as APIError from "@shared/error/APIError.ts";
import crypto from "crypto";
import Env from "env.ts";
import { NextFunction, Request, Response } from "express";

export function parseRawBody(req: Request, _res: Response, next: NextFunction) {
 try {
  if (!req.body || !Buffer.isBuffer(req.body)) {
   return next(APIError.badRequest("Invalid webhook body"));
  }

  req.rawBody = req.body;

  req.body = JSON.parse(req.rawBody.toString("utf8"));

  return next();
 } catch {
  return next(APIError.badRequest("Invalid JSON payload"));
 }
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
   .update(req.body)
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
