/** @format */
import db from "@db/db.ts";
import { category, subcategory } from "@schema/category.ts";
import { merchant } from "@schema/merchant.ts";
import { product } from "@schema/product.ts";
import AppError from "@shared/error/app-error.ts";
import * as APIError from "@shared/error/APIError.ts";
import * as helper from "@shared/helper.ts";
import {
 Pagination,
 Result,
 TCategory,
 TMerchantProducts,
 TPaginatedProducts,
 TProduct,
 TProductWithMerchant,
 TSubcategory,
 UploadImages,
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

export interface TProductFilter {
 search?: string;
 category?: string;
 subCategory?: string;
}

export const CreateProductDto = z.object({
 name: z.string(),
 description: z.string(),
 image: z.string(),
 price: z.number(),
 quantity: z.number(),
 category: z.string(),
 subCategory: z.string(),
 additionalData: z.record(z.string(), z.string()),
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
});

class ProductService {
 getMerchantProducts = async (
  userId: string,
 ): Promise<Result<TMerchantProducts, AppError>> => {
  const data = await helper.fetchMerchantProductsByUserId(userId);
  return [data, null];
 };

 getSingleProduct = async (
  productId: string,
 ): Promise<Result<TProduct, AppError>> => {
  const [productDetails] = await db
   .select()
   .from(product)
   .where(and(eq(product.id, productId), isNull(product.deletedAt)))
   .limit(1);

  if (!productDetails) return [null, APIError.notFound("Product not found")];

  return [productDetails, null];
 };

 getProductForMerchant = async (
  merchantId: string,
 ): Promise<Result<TMerchantProducts, AppError>> => {
  const data = await helper.fetchMerchantProductsFromDb(merchantId);
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
   .where(and(...filters, isNotNull(product.id)));

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
 ): Promise<Result<TProduct, AppError>> => {
  const [targetMerchantId, err] = await helper.getMerchantIdFromUser(userId);
  if (err || !targetMerchantId) return [null, err];

  const { categoryId, subCategoryId } = await helper.resolveCategoryId(
   body.category,
   body.subCategory,
  );

  const [newProduct] = await db
   .insert(product)
   .values({
    merchantId: targetMerchantId,
    name: body.name,
    description: body.description,
    image: body.image,
    price: body.price,
    quantity: body.quantity,
    categoryId,
    subCategoryId,
    category: body.category,
    subCategory: body.subCategory,
    additionalData: body.additionalData,
   })
   .returning();

  return [newProduct, null];
 };

 uploadAdditionalMediaForProduct = async (
  userId: string,
  productId: string,
  uploadedImages: UploadImages,
 ): Promise<Result<TProduct, AppError>> => {
  const [existingProduct, err] = await helper.getMerchantProduct(
   userId,
   productId,
  );
  if (err || !existingProduct) return [null, err];

  const imageLinks = uploadedImages.map((img) => img.url);

  const [updatedImages] = await db
   .update(product)
   .set({
    additionalImages: imageLinks,
   })
   .where(eq(product.id, productId))
   .returning();

  if (!updatedImages)
   return [
    null,
    APIError.notFound("Product not found or not owned by merchant"),
   ];

  return [updatedImages, null];
 };

 updatePrimaryImage = async (
  userId: string,
  productId: string,
  primaryImageUrl: string,
 ): Promise<Result<TProduct, AppError>> => {
  const [updatedProductImage] = await db
   .update(product)
   .set({
    image: primaryImageUrl,
    updatedAt: new Date(),
   })
   .where(
    and(
     eq(product.id, productId),
     inArray(product.merchantId, helper.merchantIdSubquery(userId)),
    ),
   )
   .returning();

  if (!updatedProductImage)
   return [
    null,
    APIError.notFound("Product not found or not owned by merchant"),
   ];

  return [updatedProductImage, null];
 };

 updateProduct = async (
  userId: string,
  productId: string,
  body: z.infer<typeof UpdateProductDto>,
 ): Promise<Result<TProduct, AppError>> => {
  const [existing] = await db
   .select({ deletedAt: product.deletedAt, status: product.status })
   .from(product)
   .where(
    and(
     eq(product.id, productId),
     inArray(product.merchantId, helper.merchantIdSubquery(userId)),
    ),
   )
   .limit(1);

  if (!existing)
   return [
    null,
    APIError.notFound("Product not found or not owned by merchant"),
   ];

  const updateData: Record<string, any> = {};

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

  const [updatedProduct] = await db
   .update(product)
   .set(updateData)
   .where(
    and(
     eq(product.id, productId),
     inArray(product.merchantId, helper.merchantIdSubquery(userId)),
    ),
   )
   .returning();

  if (!updatedProduct)
   return [
    null,
    APIError.notFound("Product not found or not owned by merchant"),
   ];

  return [updatedProduct, null];
 };

 deleteProduct = async (
  userId: string,
  productId: string,
 ): Promise<Result<void, AppError>> => {
  const [deletedProduct] = await db
   .update(product)
   .set({ deletedAt: new Date() })
   .where(
    and(
     eq(product.id, productId),
     inArray(product.merchantId, helper.merchantIdSubquery(userId)),
    ),
   )
   .returning();

  if (!deletedProduct)
   return [
    null,
    APIError.notFound("Product not found or not owned by merchant"),
   ];

  return [null, null];
 };

 getProductsByCategories = async (): Promise<
  Result<
   {
    category: TCategory;
    subcategories: { subcategory: TSubcategory; products: TProduct[] }[];
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
