/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { onSubscribe } from "@shared/event-bus/subscriber.ts";
import { NextFunction, Request, RequestHandler, Response } from "express";

import NotificationService from "./notification.service.ts";
import WebPushService from "../webpush/webpush.service.ts";
import { Subscription } from "../webpush/config.ts";
import z from "zod";
import { createSession } from "better-sse";
import { APIResponse, TNotification } from "@shared/types.ts";

export interface NotificationParams extends RequestHandler {
 notificationId: string;
}

class NotificationController {
 getNotifications = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
   const userId = req.user.id;
   const [data, err] = await NotificationService.getUserNotifications(userId);
   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "notifications fetched successfully",
    data,
   });
  },
 );

 getUnreadCount = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
   const userId = req.user.id;
   const [count, err] = await NotificationService.getUnreadCount(userId);
   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "unread count fetched",
    data: { unread: count },
   });
  },
 );

 markAsRead = asyncHandler(
  async (
   req: Request<NotificationParams>,
   res: Response<APIResponse<TNotification>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const notificationId = req.params.notificationId;
   const [data, err] = await NotificationService.markAsRead(
    notificationId,
    userId,
   );
   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "notification marked as read",
    data,
   });
  },
 );

 markAllAsRead = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
   const userId = req.user.id;
   const [, err] = await NotificationService.markAllAsRead(userId);
   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "all notifications marked as read",
   });
  },
 );

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

 streamNotifications = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const session = await createSession(req, res);

  const subscription = onSubscribe(userId).subscribe({
   next: (payload) => {
    session.push(payload.payload, payload.event_type);
   },
   error: (err) => {
    session.push(err.message);
   },
  });

  session.on("disconnected", () => {
   subscription.unsubscribe();
   res.end();
  });

  req.on("close", () => {
   subscription.unsubscribe();
   res.end();
  });
 };
}

export default new NotificationController();
