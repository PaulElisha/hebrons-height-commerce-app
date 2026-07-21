/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { NextFunction, Request, Response } from "express";

import WebPushService from "@module/webpush/webpush.service.ts";
import { Subscription } from "../webpush/config.ts";
import z from "zod";

export interface NotificationParams {
 notificationId?: string;
}

class WebPushController {
 subscribe = asyncHandler(
  async (
   req: Request<any, any, z.infer<typeof Subscription>>,
   res: Response,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const { endpoint, keys } = req.body;

   await WebPushService.subscribe(userId, { endpoint, keys });
   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "subscribed successfully",
   });
  },
 );

 unsubscribe = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
   const userId = req.user.id;
   const { endpoint } = req.body;

   if (!endpoint) {
    return res.status(HttpStatus.BAD_REQUEST).json({
     status: "error",
     message: "endpoint is required",
    });
   }

   await WebPushService.unsubscribe(userId, endpoint);
   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "unsubscribed successfully",
   });
  },
 );
}

export default new WebPushController();
