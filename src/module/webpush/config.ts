/** @format */

import { TPusher } from "@shared/types.ts";
import z from "zod";
import webPush from "web-push";
import Env from "env.ts";

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
 email: "mailto:Env.EMAIL_USER",
 privKey: Env.VAPID_PRIVATE_KEY,
 pubKey: Env.VAPID_PUBLIC_KEY,
});
