/** @format */
import express, { Request, Response, Router } from "express";

import { stripeWebhookHandler } from "./stripe.webhook.ts";

const stripeWebhookRouter = Router().post(
 "/webhook",
 express.raw({ type: "application/json" }),
 async (req: Request, res: Response) => {
  await stripeWebhookHandler(req, res);
 },
);

export default stripeWebhookRouter;
