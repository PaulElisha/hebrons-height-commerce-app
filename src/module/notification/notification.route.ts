/** @format */
import authenticate from "@middleware/authenticate.ts";
import { Router } from "express";

import NotificationController from "./notification.controller.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Subscription } from "../webpush/config.ts";

class NotificationRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.initializeRoutes();
 }

  initializeRoutes() {
   this.router.get("/", NotificationController.getNotifications);
   this.router.get("/stream", NotificationController.streamNotifications);
   this.router.get("/unread-count", NotificationController.getUnreadCount);
  this.router.post(
   "/subscribe",
   validate(Subscription),
   NotificationController.subscribe,
  );
  this.router.post("/unsubscribe", NotificationController.unsubscribe);
  this.router.put("/:notificationId/read", NotificationController.markAsRead);
  this.router.put("/read-all", NotificationController.markAllAsRead);
 }
}

const notificationRouter = new NotificationRouter().router;
export default notificationRouter;
