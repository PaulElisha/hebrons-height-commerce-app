/** @format */
import db from "@db/db.ts";
import { category, subcategory } from "@schema/category.ts";
import { merchant } from "@schema/merchant.ts";
import { product } from "@schema/product.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import * as helper from "@shared/helper.ts";
import {
 Pagination,
 Result,
 T,
 TCategory,
 TMerchantProducts,
 TPaginatedProducts,
 TProductWithMerchant,
 TSubcategory,
} from "@shared/types.ts";
import {
 and,
 count,
 desc,
 eq,
 ilike,
 inArray,
 isNotNull,
 isNull,
 or,
 SQL,
} from "drizzle-orm";
import FA from "fasy";
import z from "zod";

export const ProductFilter = z.object({
 search: z.string().optional(),
 category: z.string().optional(),
 subCategory: z.string().optional(),
});
export type TProductFilter = z.infer<typeof ProductFilter>;

export const CreateProductDto = z.object({
 name: z.string(),
 description: z.string(),
 image: z.string(),
 price: z.number(),
 quantity: z.number(),
 category: z.string(),
 subCategory: z.string(),
 additionalData: z.record(z.string(), z.string()),
 additonalImages: z.array(z.string()).optional(),
});

export const UpdateProductDto = z.object({
 name: z.string().optional(),
 description: z.string().optional(),
 image: z.string().optional(),
 price: z.number().positive().optional(),
 quantity: z.number().positive().optional(),
 category: z.string().optional(),
 subCategory: z.string().optional(),
 additionalData: z.record(z.string(), z.string()).optional(),
 additonalImages: z.array(z.string()).optional(),
});

class ProductService {
 getMerchantProducts = async (
  userId: string,
 ): Promise<Result<TMerchantProducts, AppError>> => {
  const [data, err] = await helper.fetchMerchantProductsByUserId(userId);
  if (err || !data) return [null, err];
  return [data, null];
 };

 getSingleProduct = async (
  productId: string,
 ): Promise<Result<T<"product">, AppError>> => {
  const [productDetails] = await db
   .select()
   .from(product)
   .where(and(eq(product.id, productId), isNull(product.deletedAt)))
   .limit(1);

  if (!productDetails) return [null, null];

  return [productDetails, null];
 };

 getProductForMerchant = async (
  merchantId: string,
 ): Promise<Result<TMerchantProducts, AppError>> => {
  const [data, err] = await helper.fetchMerchantProductsFromDb(merchantId);
  if (err || !data) return [null, err];
  return [data, null];
 };

 getLatestProducts = async (
  pagination: Pagination,
 ): Promise<Result<TProductWithMerchant[], AppError>> => {
  const { limit, pageNumber, offset } = helper.parsePagination(pagination);

  const latestProducts = await db
   .select()
   .from(product)
   .leftJoin(merchant, eq(product.merchantId, merchant.id))
   .where(and(eq(product.status, "available"), isNull(product.deletedAt)))
   .limit(limit)
   .offset(offset)
   .orderBy(desc(product.createdAt));

  const flattenedProducts =
   latestProducts?.map(({ product: p, merchant: m }) => ({
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

  return [flattenedProducts, null];
 };

 getProducts = async (
  filter: TProductFilter,
  pagination: Pagination,
 ): Promise<Result<TPaginatedProducts, AppError>> => {
  const { limit, pageNumber, offset } = helper.parsePagination(pagination);

  const filters: SQL[] = [
   eq(product?.status, "available"),
   isNull(product.deletedAt),
  ];

  if (filter?.search) {
   filters?.push(
    or(
     ilike(product?.name, `%${filter?.search}%`),
     ilike(product?.description, `%${filter?.search}%`),
    )!,
   );
  }

  if (filter?.category) {
   filters?.push(eq(product?.category, filter?.category));
  }

  if (filter?.subCategory) {
   filters?.push(eq(product?.subCategory, filter?.subCategory));
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

  return [
   {
    data: {
     products: result?.map((p) => p.product),
     pagination: {
      limit,
      pageNumber,
      totalProducts,
      totalPages,
      offset,
     },
    },
   },
   null,
  ];
 };

 createProduct = async (
  userId: string,
  body: z.infer<typeof CreateProductDto>,
 ): Promise<Result<T<"product">, AppError>> => {
  const [targetMerchantId, err] = await helper.getMerchantIdFromUser(userId);
  if (err || !targetMerchantId) return [null, err];

  const { categoryId, subCategoryId } = await helper.resolveCategoryId(
   body.category,
   body.subCategory,
  );

  const [newProduct] = await db.insert(product).values(body).returning();

  return [newProduct, null];
 };

 updateProduct = async (
  userId: string,
  productId: string,
  body: z.infer<typeof UpdateProductDto>,
 ): Promise<Result<T<"product">, AppError>> => {
  const [merchantId, e] = await helper.getMerchantIdFromUser(userId);

  if (e) return [null, e];

  const [existing] = await db
   .select({ deletedAt: product.deletedAt, status: product.status })
   .from(product)
   .where(and(eq(product.id, productId), eq(product.merchantId, merchantId!)))
   .limit(1);

  if (!existing) return [null, null];

  const updateData: Partial<typeof product.$inferInsert> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.image !== undefined) updateData.image = body.image;
  if (body.price !== undefined) updateData.price = body.price;
  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.additionalData !== undefined)
   updateData.additionalData = body.additionalData;
  updateData.deletedAt = null;

  if (existing.deletedAt || existing.status === "sold_out") {
   updateData.status = "available";
  }
  updateData.updatedAt = new Date();

  if (body.category !== undefined) {
   const ids = await helper.resolveCategoryId(body.category, body.subCategory);
   updateData.category = body.category;
   updateData.categoryId = ids.categoryId;
   if (body.subCategory !== undefined) {
    updateData.subCategory = body.subCategory;
    updateData.subCategoryId = ids.subCategoryId;
   }
  }

  if (body.additonalImages !== undefined) {
   updateData.additionalImages = body.additonalImages;
  }

  const [updatedProduct] = await db
   .update(product)
   .set(updateData)
   .where(and(eq(product.id, productId), eq(product.merchantId, merchantId!)))
   .returning();

  if (!updatedProduct) return [null, null];

  return [updatedProduct, null];
 };

 deleteProduct = async (
  userId: string,
  productId: string,
 ): Promise<Result<void, AppError>> => {
  const [merchantId, e] = await helper.getMerchantIdFromUser(userId);

  if (e) return [null, e];

  const [deletedProduct] = await db
   .update(product)
   .set({ deletedAt: new Date() })
   .where(and(eq(product.id, productId), eq(product.merchantId, merchantId!)))
   .returning();

  if (!deletedProduct) return [null, null];

  return [null, null];
 };

 getProductsByCategories = async (): Promise<
  Result<
   {
    category: TCategory;
    subcategories: { subcategory: TSubcategory; products: T<"product">[] }[];
   }[],
   AppError
  >
 > => {
  const categories = await db.select().from(category).orderBy(category.name);

  const result = await FA.concurrent.map(
   async (cat: typeof category.$inferSelect) => {
    const subs = await db
     .select()
     .from(subcategory)
     .where(eq(subcategory.categoryId, cat.id))
     .orderBy(subcategory.name);

    const subcategories = await FA.concurrent.map(
     async (sub: typeof subcategory.$inferSelect) => {
      const products = await db
       .select()
       .from(product)
       .where(
        and(
         eq(product.subCategoryId, sub.id),
         isNotNull(product.quantity),
         isNull(product.deletedAt),
        ),
       )
       .orderBy(desc(product.createdAt));

      return { subcategory: sub, products };
     },
     subs,
    );

    return { category: cat, subcategories };
   },
   categories,
  );

  return [result, null];
 };
}

export default new ProductService();
