/** @format */
import asyncHandler from "@shared/util/async-handler.ts";
import express, { Request, Response, Router } from "express";

import { bachsWebhookHandler } from "./bachs.webhook.ts";
import { parseRawBody } from "../middleware/middleware.ts";

const bachsWebhookRouter = Router().post(
 "/webhook",
 express.raw({ type: "application/json" }),
 parseRawBody,
 asyncHandler(async (req: Request, res: Response) => {
  await bachsWebhookHandler(req, res);
 }),
);

export default bachsWebhookRouter;
