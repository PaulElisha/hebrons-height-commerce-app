/** @format */

import { TPusher } from "@shared/types.ts";
import Env from "env.ts";
import webPush from "web-push";
import z from "zod";

export const Subscription = z.object({
 endpoint: z.string(),
 keys: z.object({
  auth: z.string(),
  p256dh: z.string(),
 }),
});

class Pusher<T extends TPusher> {
 constructor(protected param: T) {
  this.param = param;
 }

 config = () => {
  webPush.setVapidDetails(
   this.param.email,
   this.param.pubKey,
   this.param.privKey,
  );
 };

 sendNotification = (
  subscription: z.infer<typeof Subscription>,
  payload: string,
 ) => {
  webPush
   .sendNotification(subscription, payload)
   .then((response) =>
    console.log("Notification sent successfully:", response.statusCode),
   )
   .catch((error) => console.error("Error sending notification:", error));
 };
}

export default new Pusher<TPusher>({
 email: `mailto:${Env.EMAIL_USER}`,
 pubKey: Env.VAPID_PUBLIC_KEY,
 privKey: Env.VAPID_PRIVATE_KEY,
});
