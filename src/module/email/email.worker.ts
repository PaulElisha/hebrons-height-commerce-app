/** @format */
import logger from "@app/logger.ts";
import { MailAction } from "@module/email/dispatcher.ts";
import Mailer, { MailTemplate } from "@module/email/email.service.ts";
import type { MailData, TUser } from "@shared/types.ts";

export async function EmailWorker<U extends TUser>(
 template: MailTemplate,
 task: MailData<U>,
 max: number = 3,
) {
 let attempts = 0;
 while (attempts < max) {
  try {
   await Mailer.relayTo<U>(MailAction[template])(task);
   break;
  } catch (err) {
   attempts++;
   logger.error({ err, attempts }, "Email attempt failed");

   if (attempts >= max) {
    logger.error({ max }, "Max retries reached. Email failed completely.");
    throw err;
   }

   await new Promise((res) => setTimeout(res, 1000));
   logger.info({ attempt: attempts + 1 }, "Running email attempt");
  }
 }
}

export default EmailWorker;
