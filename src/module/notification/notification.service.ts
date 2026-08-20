/** @format */
import asError from "@shared/error/as-error.ts";
import db from "@db/db.ts";
import { notification, NotificationType } from "@db/schema/notification.ts";
import { Result, TNotification } from "@shared/types.ts";
import { and, count, desc, eq } from "drizzle-orm";

class NotificationService {
 getUserNotifications = async (
  userId: string,
 ): Promise<Result<TNotification[]>> => {
  try {
   const notifications = await db
    .select()
    .from(notification)
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(50);

   return [notifications, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getUnreadCount = async (userId: string): Promise<Result<number>> => {
  try {
   const [result] = await db
    .select({ count: count() })
    .from(notification)
    .where(
     and(eq(notification.userId, userId), eq(notification.read, "unread")),
    );

   return [Number(result?.count ?? 0), null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 markAsRead = async (
  notificationId: string,
  userId: string,
 ): Promise<Result<TNotification>> => {
  try {
   const [updated] = await db
    .update(notification)
    .set({ read: "read" })
    .where(
     and(eq(notification.id, notificationId), eq(notification.userId, userId)),
    )
    .returning();

   return [updated, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 markAllAsRead = async (userId: string): Promise<Result<void>> => {
  try {
   await db
    .update(notification)
    .set({ read: "read" })
    .where(eq(notification.userId, userId));

   return [null, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
 ): Promise<Result<TNotification>> => {
  try {
   const [created] = await db
    .insert(notification)
    .values({ userId, title, message, type })
    .returning();

   return [created, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };
}

export default new NotificationService();
