/** @format */
/** @format */

import Env from "@/env.ts";
import { MailSubject } from "@module/email/email.service.ts";
import type { MailData, MailerCallback, TUser } from "@shared/types.ts";
import type { Transporter } from "nodemailer";

export const MailAction: Record<string, MailerCallback<any, TUser>> = {
 sendOrderMemo: (transporter: Transporter, data: MailData<TUser>) => {
  const { user, message } = data;
  return transporter.sendMail({
   from: `"Temi from Hebrons Height and Gardens" <${Env.EMAIL_USER}>`,
   to: user.email,
   subject: MailSubject.sendOrderMemo,
   html: message,
  });
 },
 welcomeUser: (transporter: Transporter, data: MailData<TUser>) => {
  const { user, message } = data;
  return transporter.sendMail({
   from: `"Temi from Hebrons Height and Gardens" <${Env.EMAIL_USER}>`,
   to: user.email,
   subject: MailSubject.welcomeUser,
   html: message,
  });
 },
 forgotPassword: (transporter: Transporter, data: MailData<TUser>) => {
  const { user, message } = data;
  return transporter.sendMail({
   from: `"Temi from Hebrons Height and Gardens" <${Env.EMAIL_USER}>`,
   to: user.email,
   subject: MailSubject.forgotPassword,
   html: message,
  });
 },
 passwordReset: (transporter: Transporter, data: MailData<TUser>) => {
  const { user, message } = data;
  return transporter.sendMail({
   from: `"Temi from Hebrons Height and Gardens" <${Env.EMAIL_USER}>`,
   to: user.email,
   subject: MailSubject.passwordReset,
   html: message,
  });
 },
};
