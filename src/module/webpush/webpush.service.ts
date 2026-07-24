/** @format */
import db from "@db/db.ts";
import { pushSubscription } from "@schema/push-subscription.ts";
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
 ): Promise<void> {
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
 }

 async unsubscribe(userId: string, endpoint: string): Promise<void> {
  await db
   .delete(pushSubscription)
   .where(
    and(
     eq(pushSubscription.userId, userId),
     eq(pushSubscription.endpoint, endpoint),
    ),
   );
 }

 async sendPushNotification(
  userId: string,
  title: string,
  body: string,
 ): Promise<void> {
  const [subscriptions] = await db
   .select()
   .from(pushSubscription)
   .where(eq(pushSubscription.userId, userId));

  try {
   pusher.sendNotification(
    {
     endpoint: subscriptions.endpoint,
     keys: subscriptions.keys,
    },
    JSON.stringify({ title, body }),
   );
  } catch (err: any) {
   if (
    err instanceof Error &&
    "statusCode" in err &&
    (err as any).statusCode === 410
   ) {
    await db
     .delete(pushSubscription)
     .where(eq(pushSubscription.id, subscriptions.id));
   }
  }
 }
}

export default new WebPushService();
