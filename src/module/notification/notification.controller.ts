/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { APIResponse, T } from "@shared/types.ts";
import { createSession } from "better-sse";
import { NextFunction, Request, Response } from "express";

import { notificationBroker } from "./broker.ts";
import NotificationService from "./notification.service.ts";

export interface NotificationParams {
 notificationId: string;
}

class NotificationController {
 getNotifications = asyncHandler(
  async (
   req: Request,
   res: Response<APIResponse<T<"notification">[]>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const [data, err] = await NotificationService.getUserNotifications(userId);
   if (err || !data) return next(err);

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
   if (err || !count) return next(err);

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
   req: Request<NotificationParams>,
   res: Response<APIResponse<T<"notification">>>,
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

 streamNotifications = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const session = await createSession(req, res);

  const subscription = notificationBroker.listenToUserEvents(userId).subscribe({
   next: ({ data, eventType }) => {
    session.push(data, eventType);
   },
   error: (err: unknown) => {
    const msg = err instanceof Error ? err?.message : String(err);
    session.push(msg, "error_event");
   },
  });

  const heartbeat = setInterval(() => {
   res.write(": ping\n\n", (err) => {
    if (err) cleanUp();
   });
  }, 30_000).unref();

  function cleanUp() {
   clearInterval(heartbeat);
   subscription.unsubscribe();
   res.end();
  }

  session.on("disconnected", cleanUp);
  req.on("close", cleanUp);
 };
}

export default new NotificationController();
