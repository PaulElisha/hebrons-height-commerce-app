/** @format */
import authenticate from "@middleware/authenticate.ts";
import { Router } from "express";

import NotificationController from "./notification.controller.ts";

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
  this.router.put("/:notificationId/read", NotificationController.markAsRead);
  this.router.put("/read-all", NotificationController.markAllAsRead);
 }
}

const notificationRouter = new NotificationRouter().router;
export default notificationRouter;
