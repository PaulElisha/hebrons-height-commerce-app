/** @format */
import Env from "@/env.ts";
import type { MailData, MailerCallback } from "@shared/types.ts";
import nodemailer, { type Transporter } from "nodemailer";

export const MailSubject: Record<MailTemplate, string> = {
 welcomeUser:
  "Welcome to TheOtherWife – Your Comfort Food Journey Starts Here!",
 orderConfirmation: "Order placed - Hebrons Height & Gardens",
 forgotPassword: "Forgot Password",
 passwordReset: "Password Reset",
 // orderPlacedMerchant: "New order received - Hebrons Height & Gardens",
 // lowStockAlert: "Low stock alert - Hebrons Height & Gardens",
};

export const MAIL_TEMPLATES = [
 "orderConfirmation",
 // "orderPlacedMerchant",
 // "lowStockAlert",
 "welcomeUser",
 "forgotPassword",
 "passwordReset",
] as const;
export type MailTemplate = (typeof MAIL_TEMPLATES)[number];

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
 service: "Gmail",
 secure: true,
 pool: true,
 auth: {
  user: Env.EMAIL_USER,
  pass: Env.EMAIL_PASS,
 },
};

export default new EmailService<Transporter>(
 nodemailer.createTransport(transporterConfig),
);
