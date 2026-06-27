/** @format */
import db from "@db/db.ts";
import ErrorCode from "@enum/error-code.ts";
import HttpStatus from "@enum/http.ts";
import Mail from "nodemailer/lib/mailer/index.js";

export type HttpStatusCodeType = (typeof HttpStatus)[keyof typeof HttpStatus];

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface AuthData {
 userID: string;
 email: string;
 name: string;
 role: string;
}

export interface APIResponse<T> {
 status: "ok";
 message?: string;
 data?: T;
}

export type Result<T, U> = [T | null, null | U];

export type MailerCallback<T, U> = (
 transporter: T,
 data: MailData<U>,
) => Promise<Mail>;

export interface MailData<U> {
 user: U;
 subject: string;
 message: string;
}

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface TCart {
 id: string;
 userId: string;
 subtotal: number;
}

export interface TCartItem {
 id: string;
 productId: string;
 price: number;
 quantity: number;
 totalItemPrice: number;
}

export type TCartAndItem = {
 cart: TCart;
 cart_items: TCartItem[];
};

export interface TOrder {
 id: string;
 userId: string;
 cartId: string;
 subtotal: number;
 serviceCharge?: number;
 deliveryFee?: number;
 taxAmount?: number;
 discountAmount?: number;
 deliveryAddress?: {
  label: string;
  address: string;
  city: string;
  state: string;
  country: string;
  line1: string;
  line2: string;
 };
 orderStatus?: string;
 paymentStatus?: string;
}

export interface TOrderItem {
 id: string;
 orderId: string;
 productId: string;
 quantity: number;
 unitPrice: number;
 lineTotal: number;
}

export type TOrderAndItem = {
 order: TOrder;
 order_items: TOrderItem[];
};
