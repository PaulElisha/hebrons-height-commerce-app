/** @format */

import cloudinary from "@app/cloudinary.ts";
import HttpStatus from "@shared/enum/http.ts";
import * as APIError from "@shared/error/APIError.ts";
import { AssetType } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import { CloudinaryFolderActions } from "./dispatcher.ts";

const VALID_FOR = 300;
const FOLDER_TYPES: AssetType[] = [
 "profile",
 "product",
 "business",
 "additional",
];

const getHeaderValue = (value: string | string[] | undefined) =>
 Array.isArray(value) ? value[0] : value;

export const cloudinaryWebhookHandler = async (
 req: Request,
 res: Response,
 next: NextFunction,
) => {
 const rawBody = JSON.stringify(req.body);
 const timestamp = getHeaderValue(req.headers["x-cld-timestamp"]);
 const signature = getHeaderValue(req.headers["x-cld-signature"]);

 if (!timestamp || !signature) {
  return next(APIError.forbidden("Missing security headers"));
 }

 const timestampSeconds = Number(timestamp);

 if (Number.isNaN(timestampSeconds)) {
  return next(APIError.badRequest("Invalid timestamp"));
 }

 const valid = cloudinary.utils.verifyNotificationSignature(
  rawBody,
  timestampSeconds,
  signature,
  VALID_FOR,
 );

 if (!valid) {
  return next(APIError.forbidden("Invalid webhook signature"));
 }

 const [folder, userId] = req.body.public_id.split("-");

 if (!FOLDER_TYPES.includes(folder)) {
  return next(APIError.badRequest("Unsupported upload folder"));
 }

 const handler = CloudinaryFolderActions[folder as AssetType];

 if (!handler) {
  return next(APIError.badRequest("Unsupported upload folder"));
 }

 const [data, err] = await handler(
  { public_id: req.body.public_id, secure_url: req.body.secure_url },
  userId,
 );

 if (err || !data) return next(err);

 return res.status(HttpStatus.OK).json({
  status: "ok",
  message: "upload completed",
  data,
 });
};
