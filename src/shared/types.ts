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
 orderId?: string;
 cartId: string;
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
 serviceCharge?: number | null;
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

export type TOrderJoinRow = {
 orders: any;
 orderItem: any;
};

export type TMerchantProducts = {
 merchant: any;
 products: TProduct[];
};

export type TMerchantWithUser = {
 merchant: TMerchant;
 user: any;
};

export interface TUser {
 id: string;
 name: string;
 email: string;
}

export interface UploadImage {
 url: string;
 publicId: string;
}

export type UploadImages = UploadImage[];

export type AssetType =
 | "product_images"
 | "additional_images"
 | "avatar"
 | "product_videos";

export interface TProductThreshold {
 price: number;
 quantity: number;
}

export interface TProduct {
 id: string;
 merchantId: string | null;
 name: string;
 description: string;
 image: string;
 additionalImages: string[] | null;
 price: number;
 quantity: number;
 category: string;
 subCategory: string;
 status: string;
 additionalData: Record<string, string> | null;
 createdAt: Date;
 updatedAt: Date;
}

export interface TProductWithMerchant extends TProduct {
 merchant: {
  id: string;
  businessName: string;
  businessLogo: string;
  status: string;
 } | null;
}

export interface TPaginatedProducts {
 data: {
  products: TProduct[];
  pagination: {
   limit: number;
   pageNumber: number;
   totalProducts: number;
   totalPages: number;
   offset: number;
  };
 };
}

export interface TMerchant {
 id: string;
 userId: string;
 businessName: string;
 businessLogo: string;
 businessDescription: string;
 address: string;
 approvalStatus: string;
 approvedAt: Date | null;
 createdAt: Date;
 updatedAt: Date;
}

export interface TOrderWithUser {
 id: string;
 subtotal: number;
 deliveryAddress: Record<string, string>;
 createdAt: Date;
 user: {
  id: string;
  email: string;
  name: string;
 };
}

export interface TMerchantPaginatedOrders {
 fetchedOrders: any[];
 pagination: {
  limit: number;
  pageNumber: number;
  totalOrders: number;
  totalPages: number;
  offset: number;
 };
}

export interface TOrderItemInsert {
 orderId: string;
 productId: string;
 merchantId: string;
 quantity: number;
 unitPrice: number;
 lineTotal: number;
}
