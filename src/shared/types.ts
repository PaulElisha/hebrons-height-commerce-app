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
 orders: TOrder;
 orderItem: TOrderItems;
};

export type TMerchantProducts = {
 merchant: TMerchant;
 products: TProduct[];
};

export type TMerchantWithUser = {
 merchant: TMerchant;
 user: TUser;
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

export interface TMerchantInfo {
 id: string;
 businessName: string;
 businessLogo: string;
 status: string;
}

export interface TProductWithMerchant extends TProduct {
 merchant: TMerchantInfo | null;
}

export interface TPaginationMeta {
 limit: number;
 pageNumber: number;
 totalPages: number;
 offset: number;
}

export interface TProductPagination extends TPaginationMeta {
 totalProducts: number;
}

export interface TProductPageData {
 products: TProduct[];
 pagination: TProductPagination;
}

export interface TPaginatedProducts {
 data: TProductPageData;
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

export interface TOrderUser {
 id: string;
 email: string;
 name: string;
}

export interface TOrderWithUser {
 id: string;
 subtotal: number;
 deliveryAddress: Record<string, string>;
 createdAt: Date;
 user: TOrderUser;
}

export interface TMerchantOrdersPagination extends TPaginationMeta {
 totalOrders: number;
}

export interface TMerchantPaginatedOrders {
 fetchedOrders: TOrderJoinRow[];
 pagination: TMerchantOrdersPagination;
}

export interface TOrderItemInsert {
 orderId: string;
 productId: string;
 merchantId: string;
 quantity: number;
 unitPrice: number;
 lineTotal: number;
}

export interface TCategory {
 id: string;
 name: string;
 description: string | null;
 createdAt: Date;
 updatedAt: Date;
}

export interface TSubcategory {
 id: string;
 categoryId: string;
 name: string;
 createdAt: Date;
}

export interface TNotification {
 id: string;
 userId: string;
 title: string;
 message: string;
 type: string;
 read: string;
 createdAt: Date;
}

export interface TAnalyticsResult {
 totalOrders: number;
 totalRevenue: number;
 statusBreakdown: { status: string; count: number }[];
 topProducts: {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
 }[];
 periodCounts: { date: string; count: number; revenue: number }[];
}

export interface TPusher {
 email: string;
 pubKey: string;
 privKey: string;
}

export interface TPayment {
 email: string;
 amount: number | null;
 currency: string | null;
 rail: string;
 mode: string | null;
 id: string;
 createdAt: Date;
 updatedAt: Date;
 userId: string;
 status: string;
 orderId: string;
 attempts: number | null;
 callbackUrl: string | null;
 paymentReference: string | null;
 paymentProvider: string | null;
 accessCode: string | null;
 authorizationUrl: string | null;
 paidAt: Date | null;
}

export interface TPaymentVerificationResult {
 payment: any;
 order?: any;
}
