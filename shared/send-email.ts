/** @format */
import nodemailer, { type Transporter } from "nodemailer";
import { TUser } from "../module/auth/routes.ts";
import { MailerCallback, MailData } from "./types.ts";
import { Env } from "../env.ts";

class Service<T extends Transporter> {
 protected transporter: T;

 constructor(transporter: T) {
  this.transporter = transporter;
 }

 relayTo = <U>(callback: MailerCallback<T, U>) => {
  return (data: MailData<U>) => {
   try {
    return callback(this.transporter, data);
   } catch (error) {
    throw error;
   }
  };
 };
}

export const Mail: Record<string, MailerCallback<Transporter, TUser>> = {
 dispatcher: <T extends Transporter, U>(transporter: T, data: MailData<U>) => {
  const { user, subject, message } = data;
  return transporter.sendMail({
   from: `Hebrons Height Gardens <${Env.EMAIL_USER}>`,
   to: user as string,
   subject: subject,
   html: message,
  });
 },
};

export const Mailer = new Service<Transporter>(
 nodemailer.createTransport({
  host: Env.EMAIL_HOST,
  port: Env.EMAIL_PORT,
  secure: true,
  auth: {
   user: Env.EMAIL_USER,
   pass: Env.EMAIL_PASS,
  },
 }),
);
