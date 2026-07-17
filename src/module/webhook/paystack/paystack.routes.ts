/** @format */
import { verifyPaystackSignature } from "@module/webhook/paystack/verify-paystack-sig.ts";
import express, { Request, Response, Router } from "express";
import { paystackWebhookHandler } from "./paystack.webhook.ts";

const paystackWebhookRouter = Router().post(
 "/webhook",
 verifyPaystackSignature,
 async (req: Request, res: Response) => {
  await paystackWebhookHandler(req.body);
 },
);

export default paystackWebhookRouter;
