/** @format */
import { verifyPaystackSignature } from "@module/webhook/paystack/verify-paystack-sig.ts";
import express, { Request, Response, Router } from "express";

import { paystackWebhookHandler } from "./paystack.webhook.ts";

const paystackWebhookRouter = Router().post(
 "/webhook",
 express.raw({ type: "application/json" }),
 (req: Request, _res: Response, next) => {
  req.rawBody = req.body.toString("utf8");
  req.body = JSON.parse(req.rawBody);
  next();
 },
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
