/** @format */
import Env from "@/env.ts";
import type { MailData, MailerCallback } from "@shared/types.ts";
import nodemailer, { type Transporter } from "nodemailer";

export const MailHeading = () => ({
 welcomeUser:
  "Welcome to TheOtherWife – Your Comfort Food Journey Starts Here!",
 sendOrderMemo: "Order placed - Hebrons Height & Gardens",
 forgotPassword: "Forgot Password",
 passwordReset: "Password Reset",
});

export const MailSubject = MailHeading();

class EmailService<T> {
 protected transporter: T;

 constructor(transporter: T) {
  this.transporter = transporter;
 }

 relayTo = <U>(callback: MailerCallback<T, U>) => {
  return (data: MailData<U>) => {
   try {
    return callback(this.transporter, data);
    } catch (err) {
     throw err;
   }
  };
 };
}

const transporterConfig = {
 host: Env.EMAIL_HOST,
 port: Env.EMAIL_PORT,
 secure: true,
 family: 4,
 auth: {
  user: Env.EMAIL_USER,
  pass: Env.EMAIL_PASS,
 },
};

export default new EmailService<Transporter>(
  nodemailer.createTransport(transporterConfig),
);
