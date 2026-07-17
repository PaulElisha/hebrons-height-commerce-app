/** @format */
import { and, count, desc, eq, ilike, isNotNull, or, SQL } from "drizzle-orm";
import z from "zod";

import db from "@db/db.ts";

import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import NotFoundException from "@shared/error/not-found.ts";
import * as helper from "@shared/helper.ts";
import { Pagination, UploadImages } from "@shared/types.ts";

import { merchant } from "@schema/merchant.ts";
import { product } from "@schema/product.ts";
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
 additionalData: z.record(z.string(), z.string()),
});

class ProductService {
 getMerchantProducts = async (userId: string) => {
  const merchantId = await helper.getMerchantIdFromUser(userId);
  const data = await helper.fetchMerchantProductsFromDb(merchantId);
  return data;
 };

 getSingleProduct = async (productId: string) => {
  const [productDetails] = await db
   .select()
   .from(product)
   .where(eq(product.id, productId))
   .limit(1);

  return productDetails;
 };

 getProductForMerchant = async (merchantId: string) => {
  const data = await helper.fetchMerchantProductsFromDb(merchantId);

  return data;
 };

 getLatestProducts = async (pagination: Pagination) => {
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

  return flattenedProducts;
 };

 getProducts = async (
  filter: {
   search?: string;
   category?: string;
  },
  pagination: Pagination,
 ) => {
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

  return {
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
  };
 };

 createProduct = async (
  userId: string,
  body: z.infer<typeof CreateProductDto>,
 ) => {
  const targetMerchantId = await helper.getMerchantIdFromUser(userId);

  const [newProduct] = await db
   .insert(product)
   .values({
    merchantId: targetMerchantId,
    name: body.name,
    description: body.description,
    image: body.image,
    price: body.price,
    quantity: body.quantity,
    category: body.category,
    subCategory: body.subCategory,
    additionalData: body.additionalData,
   })
   .onConflictDoNothing()
   .returning();

  return newProduct;
 };

 uploadAdditionalMediaForProduct = async (
  userId: string,
  productId: string,
  uploadedImages: UploadImages,
 ) => {
  const targetMerchantId = await helper.getMerchantIdFromUser(userId);

  const [existingProduct] = await db
   .select()
   .from(product)
   .where(
    and(eq(product.id, productId), eq(product.merchantId, targetMerchantId)),
   )
   .limit(1);

  if (!existingProduct) {
   throw new NotFoundException(
    "product not found",
    HttpStatus.NOT_FOUND,
    ErrorCode.RESOURCE_NOT_FOUND,
   );
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

  return updatedImages;
 };

 updateProduct = async (
  userId: string,
  productId: string,
  body: z.infer<typeof UpdateProductDto>,
 ) => {
  const targetMerchantId = await helper.getMerchantIdFromUser(userId);

  const updateData: { [k: string]: any } = {};

  updateData.name = body.name && body.name;
  updateData.description = body.description ?? body.description;
  updateData.image = body.image && body.image;
  updateData.price = body.price && body.price;
  updateData.quantity = body.quantity && body.quantity;
  updateData.category = body.category && body.category;
  updateData.subCategory = body.subCategory && body.subCategory;
  updateData.additionalData = body.additionalData && body.additionalData;
  updateData.updatedAt = new Date();

  const [updatedProduct] = await db
   .update(product)
   .set(updateData)
   .where(
    and(eq(product.id, productId), eq(product.merchantId, targetMerchantId)),
   )
   .returning();

  return updatedProduct;
 };

 deleteProduct = async (userId: string, productId: string) => {
  const targetMerchantId = await helper.getMerchantIdFromUser(userId);

  await db
   .delete(product)
   .where(
    and(eq(product.merchantId, targetMerchantId), eq(product.id, productId)),
   );
 };
}

export default new ProductService();
