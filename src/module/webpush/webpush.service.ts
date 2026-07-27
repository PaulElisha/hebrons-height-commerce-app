/** @format */
import db from "@db/db.ts";
import { pushSubscription } from "@schema/push-subscription.ts";
import AppError from "@shared/error/app-error.ts";
import * as APIError from "@shared/error/APIError.ts";
import { Result } from "@shared/types.ts";
import { and, eq } from "drizzle-orm";
import z from "zod";

import Pusher, { Subscription } from "./pusher.ts";
import Env from "env.ts";

const pusher = Pusher.config({
 email: `mailto:${Env.EMAIL_USER}`,
 pubKey: Env.VAPID_PUBLIC_KEY,
 privKey: Env.VAPID_PRIVATE_KEY,
});

class WebPushService {
 async subscribe(
  userId: string,
  subscription: z.infer<typeof Subscription>,
 ): Promise<Result<void, AppError>> {
  try {
   const [existing] = await db
    .select()
    .from(pushSubscription)
    .where(
     and(
      eq(pushSubscription.userId, userId),
      eq(pushSubscription.endpoint, subscription.endpoint),
     ),
    )
    .limit(1);

   if (!existing) {
    await db.insert(pushSubscription).values({
     userId,
     endpoint: subscription.endpoint,
     keys: subscription.keys,
    });
   }

   return [null, null];
  } catch (err) {
   return [null, APIError.internalServer("Failed to subscribe")];
  }
 }

 async unsubscribe(userId: string, endpoint: string): Promise<Result<void, AppError>> {
  try {
   await db
    .delete(pushSubscription)
    .where(
     and(
      eq(pushSubscription.userId, userId),
      eq(pushSubscription.endpoint, endpoint),
     ),
    );

   return [null, null];
  } catch (err) {
   return [null, APIError.internalServer("Failed to unsubscribe")];
  }
 }

 async sendPushNotification(
  userId: string,
  title: string,
  body: string,
 ): Promise<Result<void, AppError>> {
  let sub: typeof pushSubscription.$inferSelect | undefined;

  try {
   [sub] = await db
    .select()
    .from(pushSubscription)
    .where(eq(pushSubscription.userId, userId));

   if (!sub) return [null, null];

   pusher.sendNotification(
    {
     endpoint: sub.endpoint,
     keys: sub.keys,
    },
    JSON.stringify({ title, body }),
   );

   return [null, null];
  } catch (err: any) {
   if (
    err instanceof Error &&
    "statusCode" in err &&
    (err as any).statusCode === 410 &&
    sub
   ) {
    await db
     .delete(pushSubscription)
     .where(eq(pushSubscription.id, sub.id));
   }

   return [null, null];
  }
 }
}

export default new WebPushService();
