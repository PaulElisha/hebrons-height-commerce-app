/** @format */

import logger from "@app/logger.ts";
import { TPusher } from "@shared/types.ts";
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
 config = (param: T) => {
  try {
   webPush.setVapidDetails(param.email, param.pubKey, param.privKey);
  } catch (error) {}

  return new Pusher();
 };

 sendNotification = (
  subscription: z.infer<typeof Subscription>,
  payload: string,
 ) => {
  webPush
   .sendNotification(subscription, payload)
   .then((response) =>
    logger.info({ statusCode: response.statusCode }, "Notification sent"),
   )
   .catch((error) => logger.error({ error }, "Error sending notification"));
 };
}

export default new Pusher();
