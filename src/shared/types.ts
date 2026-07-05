/** @format */
import db from "@db/db.ts";
import ErrorCode from "@enum/error-code.ts";
import HttpStatus from "@enum/http.ts";
import Mail from "nodemailer/lib/mailer/index.js";

export type HttpStatusCodeType = (typeof HttpStatus)[keyof typeof HttpStatus];

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

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

export interface Pagination {
 pageSize?: number;
 pageNumber?: number;
}

export interface TCart {
 id: string;
 userId: string;
 subtotal: number | null;
}

export interface TCartItem {
 id: string;
 productId: string;
 price: number;
 quantity: number;
 totalItemPrice: number | null;
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
 serviceCharge: number | null;
 deliveryFee: number | null;
 taxAmount: number | null;
 discountAmount: number | null;
 deliveryAddress: Record<string, string>;
 orderStatus: string;
 paymentStatus: string;
 createdAt: Date;
 updatedAt: Date;
}

export interface TOrderItems {
 id: string;
 orderId: string;
 merchantId: string;
 productId: string;
 quantity: number;
 unitPrice: number;
 lineTotal: number | null;
}

export type TOrderAndItems = {
 order: TOrder;
 order_items: TOrderItems[];
};

export interface UploadImage {
 url: string;
 publicId: string;
}

export type UploadImages = UploadImage[];
