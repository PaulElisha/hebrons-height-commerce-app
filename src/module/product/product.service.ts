/** @format */
import db from "@db/db.ts";
import { merchant } from "@schema/merchant.ts";
import { product } from "@schema/product.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import NotFoundException from "@shared/error/not-found.ts";
import * as helper from "@shared/helper.ts";
import {
 Pagination,
 Result,
 TMerchantProducts,
 TPaginatedProducts,
 TProduct,
 TProductWithMerchant,
 UploadImages,
} from "@shared/types.ts";
import { and, count, desc, eq, ilike, isNotNull, or, SQL } from "drizzle-orm";
import z from "zod";

export const CreateProductDto = z.object({
 name: z.string(),
 description: z.string(),
 image: z.string().optional(),
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
  const [merchantId, e] = await helper.getMerchantIdFromUser(userId);
  if (e || !merchantId) return [null, e];

  const data = await helper.fetchMerchantProductsFromDb(merchantId);
  return [data, null];
 };

 getSingleProduct = async (
  productId: string,
 ): Promise<Result<TProduct, AppError>> => {
  const [productDetails] = await db
   .select()
   .from(product)
   .where(eq(product.id, productId))
   .limit(1);

  if (!productDetails) {
   return [
    null,
    new NotFoundException(
     "Product not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

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
  const limit = Math.min(Math.max(pagination?.pageSize ?? 10, 1), 50);
  const pageNumber = Math.max(pagination?.pageNumber ?? 1, 1);
  const offset = (pageNumber - 1) * limit;

  const latestProducts = await db
   .select()
   .from(product)
   .leftJoin(merchant, eq(product.merchantId, merchant.id))
   .where(eq(product.status, "available"))
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
  filter: {
   search?: string;
   category?: string;
  },
  pagination: Pagination,
  ): Promise<Result<TPaginatedProducts, AppError>> => {
   const limit = Math.min(Math.max(pagination?.pageSize ?? 10, 1), 50);
   const pageNumber = Math.max(pagination?.pageNumber ?? 1, 1);
   const offset = (pageNumber - 1) * limit;

   const filters: SQL[] = [eq(product?.status, "available")];

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
  const [targetMerchantId, e] = await helper.getMerchantIdFromUser(userId);
  if (e || !targetMerchantId) return [null, e];

  const [newProduct] = await db
   .insert(product)
   .values({
    merchantId: targetMerchantId,
    name: body.name,
    description: body.description,
    image: body.image || "",
    price: body.price,
    quantity: body.quantity,
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
  const [targetMerchantId, e] = await helper.getMerchantIdFromUser(userId);
  if (e || !targetMerchantId) return [null, e];

  const [existingProduct] = await db
   .select()
   .from(product)
   .where(
    and(eq(product.id, productId), eq(product.merchantId, targetMerchantId)),
   )
   .limit(1);

  if (!existingProduct) {
   return [
    null,
    new NotFoundException(
     "product not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  const imageLinks = uploadedImages.map((img) => img.url);

  const [updatedImages] = await db
   .update(product)
   .set({
    additionalImages: imageLinks,
   })
   .where(
    and(eq(product.id, productId), eq(product.merchantId, targetMerchantId)),
   )
   .returning();

  if (!updatedImages) {
   return [
    null,
    new NotFoundException(
     "Product not found or not owned by merchant",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  return [updatedImages, null];
 };

 updateProduct = async (
  userId: string,
  productId: string,
  body: z.infer<typeof UpdateProductDto>,
 ): Promise<Result<TProduct, AppError>> => {
  const [targetMerchantId, e] = await helper.getMerchantIdFromUser(userId);
  if (e || !targetMerchantId) return [null, e];

  const updateData: { [k: string]: any } = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.image !== undefined) updateData.image = body.image;
  if (body.price !== undefined) updateData.price = body.price;
  if (body.quantity !== undefined) updateData.quantity = body.quantity;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.subCategory !== undefined) updateData.subCategory = body.subCategory;
  if (body.additionalData !== undefined) updateData.additionalData = body.additionalData;
  updateData.updatedAt = new Date();

  const [updatedProduct] = await db
   .update(product)
   .set(updateData)
   .where(
    and(eq(product.id, productId), eq(product.merchantId, targetMerchantId)),
   )
   .returning();

  if (!updatedProduct) {
   return [
    null,
    new NotFoundException(
     "Product not found or not owned by merchant",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  return [updatedProduct, null];
 };

 deleteProduct = async (
  userId: string,
  productId: string,
 ): Promise<Result<void, AppError>> => {
  const [targetMerchantId, e] = await helper.getMerchantIdFromUser(userId);
  if (e || !targetMerchantId) return [null, e];

  const [deletedProduct] = await db
   .delete(product)
   .where(
    and(eq(product.merchantId, targetMerchantId), eq(product.id, productId)),
   )
   .returning();

  if (!deletedProduct) {
   return [
    null,
    new NotFoundException(
     "Product not found or not owned by merchant",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  return [null, null];
 };
}

export default new ProductService();
