/** @format */
import db from "@db/db.ts";
import { notification } from "@schema/notification.ts";
import AppError from "@shared/error/app-error.ts";
import { Result, TNotification } from "@shared/types.ts";
import { and, count, desc, eq } from "drizzle-orm";

class NotificationService {
 getUserNotifications = async (
  userId: string,
 ): Promise<Result<TNotification[], AppError>> => {
  const notifications = await db
   .select()
   .from(notification)
   .where(eq(notification.userId, userId))
   .orderBy(desc(notification.createdAt))
   .limit(50);

  return [notifications, null];
 };

 getUnreadCount = async (userId: string): Promise<Result<number, AppError>> => {
  const [result] = await db
   .select({ count: count() })
   .from(notification)
   .where(
    and(eq(notification.userId, userId), eq(notification.read, "unread")),
   );

  return [Number(result?.count ?? 0), null];
 };

 markAsRead = async (
  notificationId: string,
  userId: string,
 ): Promise<Result<TNotification, AppError>> => {
  const [updated] = await db
   .update(notification)
   .set({ read: "read" })
   .where(
    and(eq(notification.id, notificationId), eq(notification.userId, userId)),
   )
   .returning();

  return [updated, null];
 };

 markAllAsRead = async (userId: string): Promise<Result<void, AppError>> => {
  await db
   .update(notification)
   .set({ read: "read" })
   .where(eq(notification.userId, userId));

  return [null, null];
 };

 createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: "order_update" | "stock_alert" | "system",
 ): Promise<Result<TNotification, AppError>> => {
  const [created] = await db
   .insert(notification)
   .values({ userId, title, message, type })
   .returning();

  return [created, null];
 };
}

export default new NotificationService();
