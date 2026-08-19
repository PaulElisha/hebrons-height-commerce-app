/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import { APIResponse, TNotification } from "@shared/types.ts";
import { createSession } from "better-sse";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import { notificationBroker } from "./broker.ts";
import NotificationService from "./notification.service.ts";

export const NotificationParams = z.object({
 notificationId: z.string(),
});

class NotificationController {
 getNotifications = asyncHandler(
  async (
   req: Request,
   res: Response<APIResponse<TNotification[]>>,
   next: NextFunction,
  ) => {
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
  async (
   req: Request,
   res: Response<APIResponse<{ unread: number }>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const [count, err] = await NotificationService.getUnreadCount(userId);
   if (err) return next(err);

   const unread = count ?? 0;

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "unread count fetched",
    data: { unread },
   });
  },
 );

 markAsRead = asyncHandler(
  async (
   req: Request<z.infer<typeof NotificationParams>>,
   res: Response<APIResponse<TNotification>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const notificationId = req.params.notificationId;
   const [data, err] = await NotificationService.markAsRead(
    notificationId,
    userId,
   );
   if (err) return next(err);

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

 streamNotifications = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const session = await createSession(req, res, {
   keepAlive: 30_000,
  });

  const subscription = notificationBroker.subscribe(userId).subscribe({
   next: ({ data, eventType }) => {
    session.push(data, eventType);
   },
   error: (err: Error) => {
    const msg = err.message;
    session.push(msg, "error_event");
   },
  });

  function cleanUp() {
   subscription.unsubscribe();
   res.end();
  }

  session.on("disconnected", cleanUp);
  req.on("close", cleanUp);
 };
}

export default new NotificationController();
