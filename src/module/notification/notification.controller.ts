/** @format */
import HttpStatus from "@shared/enum/http.ts";
import { EventBus } from "@shared/event-bus/index.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { consumeOutboxEvent } from "@module/outbox/outbox.service.ts";
import { APIResponse, T } from "@shared/types.ts";
import { createSession } from "better-sse";
import { NextFunction, Request, Response } from "express";

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

  const subscription = EventBus.subscribe().subscribe({
   next: async ({ payload }) => {
    await consumeOutboxEvent(payload.outboxId, async (p) => {
     if (p.userId !== userId && p.merchantId !== userId) return;
     session.push(p, payload.event_type);
    });
   },
   error: (err) => {
    session.push(err.message);
   },
  });

  const heartbeat = setInterval(() => {
   res.write(": ping\n\n", (err) => {
    if (err) {
     subscription.unsubscribe();
     clearInterval(heartbeat);
     res.end();
    }
   });
  }, 30_000).unref();

  session.on("disconnected", () => {
   clearInterval(heartbeat);
   subscription.unsubscribe();
   res.end();
  });

  req.on("close", () => {
   clearInterval(heartbeat);
   subscription.unsubscribe();
   res.end();
  });
 };
}

export default new NotificationController();
