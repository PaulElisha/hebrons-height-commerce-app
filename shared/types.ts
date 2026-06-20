/** @format */
import { type APIError } from "encore.dev/api";
import { db } from "../module/auth/db.ts";
import Mail from "nodemailer/lib/mailer";

export interface AuthData {
 userID: string;
 email: string;
 name: string;
 role: string;
}

export interface Response<T> {
 status?: "ok" | "error";
 message?: string;
 data?: T;
}

export type Result<T, U extends APIError> = [T | null, null | U];

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
 };
 orderStatus?: string;
 paymentStatus?: string;
}

export interface TOrderItems {
 id: string;
 orderId: string;
 productId: string;
 quantity: number;
 unitPrice: number;
 lineTotal: number;
}

export type TOrderAndItem = {
 order: TOrder;
 order_items: TOrderItems[];
};
