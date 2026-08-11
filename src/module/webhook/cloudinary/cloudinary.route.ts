/** @format */
import asyncHandler from "@shared/util/async-handler.ts";
import express, { NextFunction, Request, Response, Router } from "express";

import { cloudinaryWebhookHandler } from "./cloudinary.webhook.ts";

const cloudinaryWebhookRouter = Router().post(
 "/cloudinary",
 express.raw({ type: "application/json" }),
 asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await cloudinaryWebhookHandler(req, res, next);
 }),
);

export default cloudinaryWebhookRouter;
