/** @format */
import db from "@db/db.ts";
import { user } from "@db/schema/auth.ts";
import { merchant } from "@db/schema/merchant.ts";
import { order, orderItem } from "@db/schema/order.ts";
import { product } from "@db/schema/product.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { getMerchantIdFromUser } from "@shared/helper.ts";
import {
 Result,
 TAnalyticsResult,
 TMerchant,
 TMerchantWithUser,
} from "@shared/types.ts";
import { and, count, desc, eq, isNull, sql, sum } from "drizzle-orm";
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
 getMerchantProfile = async (
  userId: string,
 ): Promise<Result<TMerchantWithUser, AppError>> => {
  const [merchantProfile] = await db
   .select()
   .from(merchant)
   .innerJoin(user, eq(merchant.userId, user.id))
   .where(and(eq(merchant?.userId, userId), isNull(merchant.deletedAt)))
   .limit(1);

  if (!merchantProfile) return [null, null];

  return [merchantProfile, null];
 };

 createMerchantProfile = async (
  userId: string,
  body: z.infer<typeof CreateMerchantDto>,
 ): Promise<Result<TMerchant, AppError>> => {
  const [newMerchant] = await db
   .insert(merchant)
   .values({
    userId: userId,
    businessName: body.businessName,
    businessLogo: body.businessLogo,
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
  const updateData: Partial<typeof merchant.$inferInsert> = {};

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
   .where(and(eq(merchant.userId, userId), eq(merchant.id, merchantId)))
   .returning();

  if (!updatedMerchant) return [null, null];

  return [updatedMerchant, null];
 };

 deleteMerchantProfile = async (
  userId: string,
  merchantId: string,
 ): Promise<Result<void, AppError>> => {
  const [deletedMerchant] = await db
   .update(merchant)
   .set({ deletedAt: new Date() })
   .where(and(eq(merchant.userId, userId), eq(merchant.id, merchantId)))
   .returning();

  if (!deletedMerchant) return [null, null];

  return [null, null];
 };

 getAnalytics = async (
  userId: string,
 ): Promise<Result<TAnalyticsResult, AppError>> => {
  const [merchantId, err] = await getMerchantIdFromUser(userId);
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
