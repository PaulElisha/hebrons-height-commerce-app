/** @format */
import asError from "@shared/error/as-error.ts";
import db from "@db/db.ts";
import { user } from "@db/schema/auth.ts";
import { category, subcategory } from "@db/schema/category.ts";
import { merchant } from "@db/schema/merchant.ts";
import { notification } from "@db/schema/notification.ts";
import { order, orderItem } from "@db/schema/order.ts";
import { payment } from "@db/schema/payment.ts";
import { product } from "@db/schema/product.ts";
import * as APIError from "@shared/error/APIError.ts";
import { isLowStock, parsePagination } from "@shared/helper.ts";
import { ORDER_STATUSES } from "@shared/types.ts";
import {
 Pagination,
 Result,
 TAdminAnalytics,
 TAdminPaginatedMerchants,
 TAdminPaginatedOrders,
 TAdminPaginatedPayments,
 TAdminPaginatedProducts,
 TAdminPaginatedUsers,
 TCategory,
 TMerchant,
 TMerchantWithUser,
 TNotification,
 TOrderAndItems,
 TProductWithMerchant,
 TSubcategory,
 TUserFull,
} from "@shared/types.ts";
import {
 and,
 count,
 desc,
 eq,
 ilike,
 isNull,
 ne,
 or,
 SQL,
 sql,
 sum,
} from "drizzle-orm";
import { Transactional } from "drizzle-transactional";
import z from "zod";

export const ReviewMerchantDto = z.object({
 approvalStatus: z.enum(["approved", "rejected"]),
});

export const CreateCategoryDto = z.object({
 name: z.string(),
 description: z.string().optional(),
 subcategories: z.array(z.string()).optional(),
});

export const UpdateCategoryDto = z.object({
 name: z.string().optional(),
 description: z.string().optional(),
});

export const CreateSubcategoryDto = z.object({
 name: z.string(),
});

export const UpdateSubcategoryDto = z.object({
 name: z.string(),
});

export const SendNotificationDto = z.object({
 userId: z.string().optional(),
 title: z.string(),
 message: z.string(),
 type: z.enum(["order_update", "stock_alert", "system"]),
});

export const AdminQuery = z.object({
 search: z.string().optional(),
 approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
 orderStatus: z.enum(ORDER_STATUSES).optional(),
 paymentStatus: z
  .enum(["pending", "initialized", "paid", "failed", "cancelled", "refunded"])
  .optional(),
});
export type TAdminQuery = z.infer<typeof AdminQuery>;

class AdminService {
 getAnalytics = async (): Promise<Result<TAdminAnalytics>> => {
  try {
   const [totals] = await db
    .select({
     totalOrders: count(),
     totalRevenue: sum(order.subtotal),
    })
    .from(order);

   const [userCount] = await db.select({ total: count() }).from(user);

   const [merchantCount] = await db
    .select({ total: count() })
    .from(merchant)
    .where(isNull(merchant.deletedAt));

   const [approvedMerchantCount] = await db
    .select({ total: count() })
    .from(merchant)
    .where(
     and(isNull(merchant.deletedAt), eq(merchant.approvalStatus, "approved")),
    );

   const [pendingMerchantCount] = await db
    .select({ total: count() })
    .from(merchant)
    .where(
     and(isNull(merchant.deletedAt), eq(merchant.approvalStatus, "pending")),
    );

   const [productCount] = await db
    .select({ total: count() })
    .from(product)
    .where(isNull(product.deletedAt));

   const statusBreakdown = await db
    .select({
     status: order.orderStatus,
     count: count(),
    })
    .from(order)
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
    .where(sql`${order.createdAt} >= NOW() - INTERVAL '30 days'`)
    .groupBy(sql`DATE(${order.createdAt})`)
    .orderBy(sql`DATE(${order.createdAt})`);

   return [
    {
     totalOrders: Number(totals?.totalOrders ?? 0),
     totalRevenue: Number(totals?.totalRevenue ?? 0),
     totalUsers: Number(userCount?.total ?? 0),
     totalMerchants: Number(merchantCount?.total ?? 0),
     totalProducts: Number(productCount?.total ?? 0),
     approvedMerchants: Number(approvedMerchantCount?.total ?? 0),
     pendingMerchants: Number(pendingMerchantCount?.total ?? 0),
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
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getUsers = async (
  query: TAdminQuery,
  pagination: Pagination = {},
 ): Promise<Result<TAdminPaginatedUsers>> => {
  try {
   const { limit, pageNumber, offset } = parsePagination(pagination);

   const filters: SQL[] = [];

   if (query?.search) {
    filters.push(
     or(
      ilike(user.name, `%${query.search}%`),
      ilike(user.email, `%${query.search}%`),
     )!,
    );
   }

   const result = await db
    .select()
    .from(user)
    .where(and(...filters))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(user.createdAt));

   const [totalCountResult] = await db
    .select({ totalCount: count() })
    .from(user)
    .where(and(...filters));

   const totalUsers = Number(totalCountResult?.totalCount);
   const totalPages = Math.ceil(totalUsers / limit);

   return [
    {
     data: result,
     pagination: {
      limit,
      pageNumber,
      totalUsers,
      totalPages,
      offset,
     },
    },
    null,
   ];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getUser = async (userId: string): Promise<Result<TUserFull>> => {
  try {
   const [existing] = await db
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

   if (!existing) return [null, null];

   return [existing, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getMerchants = async (
  query: TAdminQuery,
  pagination: Pagination = {},
 ): Promise<Result<TAdminPaginatedMerchants>> => {
  try {
   const { limit, pageNumber, offset } = parsePagination(pagination);

   const filters: SQL[] = [isNull(merchant.deletedAt)];

   if (query?.approvalStatus) {
    filters.push(eq(merchant.approvalStatus, query.approvalStatus));
   }

   const result = await db
    .select()
    .from(merchant)
    .innerJoin(user, eq(merchant.userId, user.id))
    .where(and(...filters))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(merchant.createdAt));

   const [totalCountResult] = await db
    .select({ totalCount: count() })
    .from(merchant)
    .where(and(...filters));

   const totalMerchants = Number(totalCountResult?.totalCount);
   const totalPages = Math.ceil(totalMerchants / limit);

   return [
    {
     data: result,
     pagination: {
      limit,
      pageNumber,
      totalMerchants,
      totalPages,
      offset,
     },
    },
    null,
   ];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getMerchant = async (
  merchantId: string,
 ): Promise<Result<TMerchantWithUser>> => {
  try {
   const [existing] = await db
    .select()
    .from(merchant)
    .innerJoin(user, eq(merchant.userId, user.id))
    .where(and(eq(merchant.id, merchantId), isNull(merchant.deletedAt)))
    .limit(1);

   if (!existing) return [null, null];

   return [existing, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 @Transactional()
 reviewMerchant = async (
  merchantId: string,
  body: z.infer<typeof ReviewMerchantDto>,
 ): Promise<Result<TMerchant>> => {
  const [existing] = await db
   .select({ id: merchant.id, approvalStatus: merchant.approvalStatus })
   .from(merchant)
   .where(and(eq(merchant.id, merchantId), isNull(merchant.deletedAt)))
   .limit(1);

  if (!existing) return [null, null];

  if (existing.approvalStatus === body.approvalStatus)
   return [
    null,
    APIError.badRequest(`Merchant is already ${body.approvalStatus}`),
   ];

  const [updatedMerchant] = await db
   .update(merchant)
   .set({
    approvalStatus: body.approvalStatus,
    approvedAt: body.approvalStatus === "approved" ? new Date() : null,
    updatedAt: new Date(),
   })
   .where(eq(merchant.id, merchantId))
   .returning();

  if (!updatedMerchant) return [null, null];

  return [updatedMerchant, null];
 };

 getOrders = async (
  query: TAdminQuery,
  pagination: Pagination = {},
 ): Promise<Result<TAdminPaginatedOrders>> => {
  try {
   const { limit, pageNumber, offset } = parsePagination(pagination);

   const filters: SQL[] = [];

   if (query?.orderStatus) {
    filters.push(eq(order.orderStatus, query.orderStatus));
   }

   const result = await db
    .select({
     id: order.id,
     subtotal: order.subtotal,
     deliveryAddress: order.deliveryAddress,
     createdAt: order.createdAt,
     user: {
      id: user.id,
      email: user.email,
      name: user.name,
     },
    })
    .from(order)
    .innerJoin(user, eq(order.userId, user.id))
    .where(and(...filters))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(order.createdAt));

   const [totalCountResult] = await db
    .select({ totalCount: count() })
    .from(order)
    .where(and(...filters));

   const totalOrders = Number(totalCountResult?.totalCount);
   const totalPages = Math.ceil(totalOrders / limit);

   return [
    {
     data: result,
     pagination: {
      limit,
      pageNumber,
      totalOrders,
      totalPages,
      offset,
     },
    },
    null,
   ];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getOrderDetails = async (orderId: string): Promise<Result<TOrderAndItems>> => {
  try {
   const result = await db
    .select()
    .from(order)
    .innerJoin(orderItem, eq(order.id, orderItem.orderId))
    .innerJoin(product, eq(orderItem.productId, product.id))
    .where(eq(order.id, orderId));

   if (result.length <= 0) return [null, null];

   return [
    {
     order: result[0].orders,
     order_items: result.map(({ orderItem, product }) => ({
      ...orderItem,
      lineTotal: Number(orderItem.lineTotal),
      product,
      lowStock: isLowStock(Number(product.quantity)),
     })),
    },
    null,
   ];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getProducts = async (
  query: TAdminQuery,
  pagination: Pagination = {},
 ): Promise<Result<TAdminPaginatedProducts>> => {
  try {
   const { limit, pageNumber, offset } = parsePagination(pagination);

   const filters: SQL[] = [];

   if (query?.search) {
    filters.push(
     or(
      ilike(product.name, `%${query.search}%`),
      ilike(product.description, `%${query.search}%`),
     )!,
    );
   }

   const result = await db
    .select()
    .from(product)
    .leftJoin(merchant, eq(product.merchantId, merchant.id))
    .where(and(...filters))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(product.createdAt));

   const [totalCountResult] = await db
    .select({ totalCount: count() })
    .from(product)
    .where(and(...filters));

   const totalProducts = Number(totalCountResult?.totalCount);
   const totalPages = Math.ceil(totalProducts / limit);

   const products: TProductWithMerchant[] =
    result?.map(({ product: p, merchant: m }) => ({
     ...p,
     merchant: m
      ? {
         id: m?.id,
         businessName: m?.businessName,
         businessLogo: m?.businessLogo,
         status: m?.approvalStatus,
        }
      : null,
    })) || [];

   return [
    {
     data: products,
     pagination: {
      limit,
      pageNumber,
      totalProducts,
      totalPages,
      offset,
     },
    },
    null,
   ];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 deleteProduct = async (productId: string): Promise<Result<void>> => {
  try {
   const [deletedProduct] = await db
    .update(product)
    .set({ deletedAt: new Date() })
    .where(eq(product.id, productId))
    .returning();

   if (!deletedProduct) return [null, null];

   return [null, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getPayments = async (
  query: TAdminQuery,
  pagination: Pagination = {},
 ): Promise<Result<TAdminPaginatedPayments>> => {
  try {
   const { limit, pageNumber, offset } = parsePagination(pagination);

   const filters: SQL[] = [];

   if (query?.paymentStatus) {
    filters.push(eq(payment.status, query.paymentStatus));
   }

   const result = await db
    .select()
    .from(payment)
    .where(and(...filters))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(payment.createdAt));

   const [totalCountResult] = await db
    .select({ totalCount: count() })
    .from(payment)
    .where(and(...filters));

   const totalPayments = Number(totalCountResult?.totalCount);
   const totalPages = Math.ceil(totalPayments / limit);

   return [
    {
     data: result,
     pagination: {
      limit,
      pageNumber,
      totalPayments,
      totalPages,
      offset,
     },
    },
    null,
   ];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 @Transactional()
 createCategory = async (
  body: z.infer<typeof CreateCategoryDto>,
 ): Promise<Result<TCategory>> => {
  const [existing] = await db
   .select({ id: category.id })
   .from(category)
   .where(eq(category.name, body.name))
   .limit(1);

  if (existing)
   return [null, APIError.badRequest(`Category ${body.name} already exists`)];

  const [newCategory] = await db
   .insert(category)
   .values({
    name: body.name,
    description: body.description,
   })
   .returning();

  if (!newCategory) return [null, null];

  if (body.subcategories && body.subcategories.length > 0) {
   await db
    .insert(subcategory)
    .values(
     body.subcategories.map((name) => ({
      categoryId: newCategory.id,
      name,
     })),
    )
    .returning();
  }

  return [newCategory, null];
 };

 @Transactional()
 updateCategory = async (
  categoryId: string,
  body: z.infer<typeof UpdateCategoryDto>,
 ): Promise<Result<TCategory>> => {
  const [existing] = await db
   .select({ id: category.id })
   .from(category)
   .where(eq(category.id, categoryId))
   .limit(1);

  if (!existing) return [null, null];

  if (body.name) {
   const [nameTaken] = await db
    .select({ id: category.id })
    .from(category)
    .where(and(eq(category.name, body.name), ne(category.id, categoryId)))
    .limit(1);

   if (nameTaken)
    return [null, APIError.badRequest(`Category ${body.name} already exists`)];
  }

  const updateData: Partial<typeof category.$inferInsert> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  updateData.updatedAt = new Date();

  const [updatedCategory] = await db
   .update(category)
   .set(updateData)
   .where(eq(category.id, categoryId))
   .returning();

  if (!updatedCategory) return [null, null];

  return [updatedCategory, null];
 };

 @Transactional()
 createSubcategory = async (
  categoryId: string,
  body: z.infer<typeof CreateSubcategoryDto>,
 ): Promise<Result<TSubcategory>> => {
  const [existingCategory] = await db
   .select({ id: category.id })
   .from(category)
   .where(eq(category.id, categoryId))
   .limit(1);

  if (!existingCategory) return [null, null];

  const [newSubcategory] = await db
   .insert(subcategory)
   .values({
    categoryId,
    name: body.name,
   })
   .returning();

  if (!newSubcategory) return [null, null];

  return [newSubcategory, null];
 };

 updateSubcategory = async (
  subcategoryId: string,
  body: z.infer<typeof UpdateSubcategoryDto>,
 ): Promise<Result<TSubcategory>> => {
  try {
   const [updatedSubcategory] = await db
    .update(subcategory)
    .set({ name: body.name })
    .where(eq(subcategory.id, subcategoryId))
    .returning();

   if (!updatedSubcategory) return [null, null];

   return [updatedSubcategory, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 deleteSubcategory = async (subcategoryId: string): Promise<Result<void>> => {
  try {
   const [deletedSubcategory] = await db
    .delete(subcategory)
    .where(eq(subcategory.id, subcategoryId))
    .returning();

   if (!deletedSubcategory) return [null, null];

   return [null, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 @Transactional()
 sendNotification = async (
  body: z.infer<typeof SendNotificationDto>,
 ): Promise<Result<TNotification>> => {
  const { userId, title, message, type } = body;

  if (userId) {
   const [targetUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

   if (!targetUser) return [null, null];

   const [created] = await db
    .insert(notification)
    .values({ userId, title, message, type })
    .returning();

   if (!created) return [null, null];

   return [created, null];
  }

  const allUsers = await db.select({ id: user.id }).from(user);

  if (allUsers.length <= 0) return [null, null];

  const [created] = await db
   .insert(notification)
   .values(allUsers.map((u) => ({ userId: u.id, title, message, type })))
   .returning();

  return [created, null];
 };
}

export default new AdminService();
