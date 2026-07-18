/** @format */
import { verifyPaystackSignature } from "./middleware.ts";
import express, { Request, Response, Router } from "express";

import { parsePaystackBody } from "./middleware.ts";
import { paystackWebhookHandler } from "./paystack.webhook.ts";

const paystackWebhookRouter = Router().post(
 "/webhook",
 express.raw({ type: "application/json" }),
 parsePaystackBody,
 verifyPaystackSignature,
 async (req: Request, res: Response) => {
  try {
   await paystackWebhookHandler(req.body);
   res.status(200).json({ status: "success" });
  } catch {
   res.status(200).json({ status: "success" });
  }
 },
);

export default paystackWebhookRouter;
