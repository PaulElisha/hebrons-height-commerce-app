/** @format */
import { MailAction } from "@module/email/dispatcher.ts";
import Mailer from "@module/email/email.service.ts";

import type { MailData, TUser } from "@shared/types.ts";
export async function EmailWorker<U extends TUser>(
 task: MailData<U>,
 max: number = 3,
) {
 let attempts = 0;
 while (attempts < max) {
  try {
   await Mailer.relayTo<U>(MailAction.sendOrderMemo)(task);
   break;
  } catch (err) {
   attempts++;
   console.error(`Attempt ${attempts} failed`, err);

   if (attempts >= max) {
    console.error(`Max retries (${max}) reached. Email failed completely.`);
    throw err;
   }

   await new Promise((res) => setTimeout(res, 1000));
   console.log(`Running attempt configuration #${attempts + 1}`);
  }
 }
}

export default EmailWorker;
