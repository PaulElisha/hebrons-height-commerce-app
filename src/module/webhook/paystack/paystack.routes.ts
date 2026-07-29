/** @format */
import asyncHandler from "@shared/middleware/async-handler.ts";
import express, { Request, Response, Router } from "express";

import { parsePaystackBody, verifyPaystackSignature } from "./middleware.ts";
import { paystackWebhookHandler } from "./paystack.webhook.ts";

const paystackWebhookRouter = Router().post(
 "/paystack",
 express.raw({ type: "application/json" }),
 parsePaystackBody,
 verifyPaystackSignature,
 asyncHandler(async (req: Request, res: Response) => {
  await paystackWebhookHandler(req, res);
  res.status(200).json({ status: "success" });
 }),
);

export default paystackWebhookRouter;
