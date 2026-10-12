/** @format */
import asyncHandler from "@shared/util/async-handler.ts";
import express, { Request, Response, Router } from "express";

import { parseRawBody, verifyPaystackSignature } from "./middleware.ts";
import { paystackWebhookHandler } from "./paystack.webhook.ts";

const paystackWebhookRouter = Router().post(
 "/webhook",
 express.raw({ type: "application/json" }),
 verifyPaystackSignature,
 parseRawBody,
 asyncHandler(async (req: Request, res: Response) => {
  await paystackWebhookHandler(req, res);
 }),
);

export default paystackWebhookRouter;
