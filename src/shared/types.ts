/** @format */
import ErrorCode from "@enum/error-code.ts";
import HttpStatus from "@enum/http.ts";
import Mail from "nodemailer/lib/mailer/index.js";
import { z } from "zod";

export type HttpStatusCodeType = (typeof HttpStatus)[keyof typeof HttpStatus];

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface APIResponse<T> {
 status: "ok";
 message?: string;
 data?: T | null;
}

export type Result<T, U = Error> = [T | null, null | U];

export type MailerCallback<T, U> = (
 transporter: T,
 data: MailData<U>,
) => Promise<Mail>;

export interface MailData<U> {
 user: U;
 message: string;
}

export const PaginationSchema = z.object({
 pageSize: z.coerce.number().optional(),
 pageNumber: z.coerce.number().optional(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

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
 cart_items: (TCartItem & { product: TProduct; lowStock: boolean })[];
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

export interface TOrderItemsWithProduct extends TOrderItems {
 product: TProduct;
 lowStock: boolean;
}

export type TOrderAndItems = {
 order: TOrder;
 order_items: TOrderItemsWithProduct[];
};

export type TOrderJoinRow = {
 orders: TOrder;
 orderItem: TOrderItems;
};

export type TUserOrderWithItems = {
 orders: TOrder;
 order_items: TOrderItemsWithProduct[];
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

export const AssetTypeEnum = z.enum([
 "profile",
 "product",
 "business",
 "additional",
]);
export type AssetType = z.infer<typeof AssetTypeEnum>;

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

export interface TMerchantInfo extends Pick<
 TMerchant,
 "id" | "businessName" | "businessLogo"
> {
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

export interface TOrderWithUser extends Pick<
 TOrder,
 "id" | "subtotal" | "deliveryAddress" | "createdAt"
> {
 user: TUser;
}

export interface TMerchantOrdersPagination extends TPaginationMeta {
 totalOrders: number;
}

export interface TMerchantPaginatedOrders {
 fetchedOrders: TOrderJoinRow[];
 pagination: TMerchantOrdersPagination;
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
 payment: TPayment;
 order?: TOrder;
}

export interface TAdminAnalytics extends TAnalyticsResult {
 totalUsers: number;
 totalMerchants: number;
 totalProducts: number;
 approvedMerchants: number;
 pendingMerchants: number;
}

export interface TUserFull extends TUser {
 emailVerified: boolean;
 image: string | null;
 role: string;
 createdAt: Date;
 updatedAt: Date;
}

export interface TAdminUsersPagination extends TPaginationMeta {
 totalUsers: number;
}

export type Paginated<
 TData,
 TMeta extends TPaginationMeta = TPaginationMeta,
> = {
 data: TData;
 pagination: TMeta;
};

export type TAdminPaginatedUsers = Paginated<
 TUserFull[],
 TAdminUsersPagination
>;

export interface TAdminMerchantsPagination extends TPaginationMeta {
 totalMerchants: number;
}

export type TAdminPaginatedMerchants = Paginated<
 TMerchantWithUser[],
 TAdminMerchantsPagination
>;

export interface TAdminOrdersPagination extends TPaginationMeta {
 totalOrders: number;
}

export type TAdminPaginatedOrders = Paginated<
 TOrderWithUser[],
 TAdminOrdersPagination
>;

export interface TAdminPaymentsPagination extends TPaginationMeta {
 totalPayments: number;
}

export type TAdminPaginatedPayments = Paginated<
 TPayment[],
 TAdminPaymentsPagination
>;

export interface TAdminProductsPagination extends TPaginationMeta {
 totalProducts: number;
}

export type TAdminPaginatedProducts = Paginated<
 TProductWithMerchant[],
 TAdminProductsPagination
>;
