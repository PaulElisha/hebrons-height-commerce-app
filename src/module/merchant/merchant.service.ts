/** @format */
import db from "@db/db.ts";
import { user } from "@schema/auth.ts";
import { merchant } from "@schema/merchant.ts";
import { order, orderItem } from "@schema/order.ts";
import { product } from "@schema/product.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import NotFoundException from "@shared/error/not-found.ts";
import {
 Result,
 TAnalyticsResult,
 TMerchant,
 TMerchantWithUser,
} from "@shared/types.ts";
import { and, count, desc, eq, isNotNull, SQL, sql, sum } from "drizzle-orm";
import z from "zod";

export const CreateMerchantDto = z.object({
 businessName: z.string(),
 businessLogo: z.string(),
 businessDescription: z.string(),
 address: z.string(),
});

export const UpdateMerchantDto = z.object({
 businessName: z.string().optional(),
 businessLogo: z.string().optional(),
 businessDescription: z.string().optional(),
 address: z.string().optional(),
});

class MerchantService {
 getMerchantIdFromProductId = async (productId: string): Promise<any> => {
  const [productMerchant] = await db
   .select()
   .from(product)
   .innerJoin(merchant, eq(product.merchantId, merchant.id))
   .where(eq(product.id, productId));

  return productMerchant?.merchant;
 };

 getMerchantProfile = async (
  userId: string,
 ): Promise<Result<TMerchantWithUser, AppError>> => {
  const [merchantProfile] = await db
   .select()
   .from(merchant)
   .innerJoin(user, eq(merchant.userId, user.id))
   .where(and(eq(merchant?.userId, userId), isNotNull(merchant?.id)))
   .limit(1);

  if (!merchantProfile) {
   return [
    null,
    new NotFoundException(
     "Merchant profile not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  return [merchantProfile, null];
 };

 createMerchantProfile = async (
  userId: string,
  body: z.infer<typeof CreateMerchantDto>,
 ): Promise<Result<TMerchant, AppError>> => {
  const [existing] = await db
   .select()
   .from(merchant)
   .where(eq(merchant.userId, userId))
   .limit(1);

  if (existing) {
   return [
    null,
    new BadRequestException(
     "A merchant profile already exists for this user.",
     HttpStatus.CONFLICT,
     ErrorCode.ACCESS_UNAUTHORIZED,
    ),
   ];
  }

  const [newMerchant] = await db
   .insert(merchant)
   .values({
    userId: userId,
    businessName: body.businessName,
    businessLogo: body.businessLogo || "",
    businessDescription: body.businessDescription,
    address: body.address,
   })
   .returning();

  return [newMerchant, null];
 };

 updateMerchantProfile = async (
  userId: string,
  merchantId: string,
  body: z.infer<typeof UpdateMerchantDto>,
 ): Promise<Result<TMerchant, AppError>> => {
  const updateData: Record<string, any> = {};

  if (body.businessName !== undefined)
   updateData.businessName = body.businessName;
  if (body.businessDescription !== undefined)
   updateData.businessDescription = body.businessDescription;
  if (body.businessLogo !== undefined)
   updateData.businessLogo = body.businessLogo;
  if (body.address !== undefined) updateData.address = body.address;
  updateData.updatedAt = new Date();

  const [updatedMerchant] = await db
   .update(merchant)
   .set(updateData)
   .where(
    and(
     eq(merchant.userId, userId),
     eq(merchant.id, merchantId),
     isNotNull(merchant.id),
    ),
   )
   .returning();

  if (!updatedMerchant) {
   return [
    null,
    new NotFoundException(
     "Merchant profile not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  return [updatedMerchant, null];
 };

 deleteMerchantProfile = async (
  userId: string,
  merchantId: string,
 ): Promise<Result<void, AppError>> => {
  const [deletedMerchant] = await db
   .delete(merchant)
   .where(and(eq(merchant.userId, userId), eq(merchant.id, merchantId)))
   .returning();

  if (!deletedMerchant) {
   return [
    null,
    new NotFoundException(
     "Merchant profile not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  return [null, null];
 };

 getAnalytics = async (
  userId: string,
 ): Promise<Result<TAnalyticsResult, AppError>> => {
  const [merchantId, err] = await import("@shared/helper.ts").then((m) =>
   m.getMerchantIdFromUser(userId),
  );
  if (err || !merchantId) return [null, err];

  const [totalResult] = await db
   .select({
    totalOrders: count(),
    totalRevenue: sum(orderItem.lineTotal),
   })
   .from(orderItem)
   .where(eq(orderItem.merchantId, merchantId));

  const statusBreakdown = await db
   .select({
    status: order.orderStatus,
    count: count(),
   })
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(eq(orderItem.merchantId, merchantId))
   .groupBy(order.orderStatus);

  const topProducts = await db
   .select({
    productId: orderItem.productId,
    name: product.name,
    quantity: sql<number>`COALESCE(SUM(${orderItem.quantity}), 0)`,
    revenue: sql<number>`COALESCE(SUM(${orderItem.lineTotal}), 0)`,
   })
   .from(orderItem)
   .innerJoin(product, eq(orderItem.productId, product.id))
   .where(eq(orderItem.merchantId, merchantId))
   .groupBy(orderItem.productId, product.name)
   .orderBy(desc(sql`COALESCE(SUM(${orderItem.lineTotal}), 0)`))
   .limit(10);

  const periodCounts = await db
   .select({
    date: sql<string>`DATE(${order.createdAt})`,
    count: count(),
    revenue: sql<number>`COALESCE(SUM(${orderItem.lineTotal}), 0)`,
   })
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(
    and(
     eq(orderItem.merchantId, merchantId),
     sql`${order.createdAt} >= NOW() - INTERVAL '30 days'`,
    ),
   )
   .groupBy(sql`DATE(${order.createdAt})`)
   .orderBy(sql`DATE(${order.createdAt})`);

  return [
   {
    totalOrders: Number(totalResult?.totalOrders ?? 0),
    totalRevenue: Number(totalResult?.totalRevenue ?? 0),
    statusBreakdown: statusBreakdown.map((s) => ({
     status: s.status,
     count: Number(s.count),
    })),
    topProducts: topProducts.map((p) => ({
     productId: p.productId,
     name: p.name,
     quantity: Number(p.quantity),
     revenue: Number(p.revenue),
    })),
    periodCounts: periodCounts.map((p) => ({
     date: String(p.date),
     count: Number(p.count),
     revenue: Number(p.revenue),
    })),
   },
   null,
  ];
 };
}

export default new MerchantService();
