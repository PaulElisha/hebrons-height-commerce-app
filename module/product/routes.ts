/** @format */

import { and, count, desc, eq, ilike, isNotNull, or, SQL } from "drizzle-orm";
import { api, Query } from "encore.dev/api";

import { db } from "../../module/auth/db.ts";
import { merchant } from "../../schema/merchant.ts";
import { product } from "../../schema/product";
import { getAuth } from "../../shared/get-auth.ts";
import * as helper from "../../shared/helper.ts";
import { AuthData, Response } from "../../shared/types.ts";

interface CreateProductDto {
 name: string;
 description: string;
 image: string;
 price: number;
 quantity: number;
 category: string;
 subCategory: string;
 additionalData: Record<string, string>;
}

interface UpdateProductDto {
 productId: string;
 name?: string;
 description?: string;
 image?: string;
 price?: number;
 quantity?: number;
 category?: string;
 subCategory?: string;
 additionalData?: Record<string, string>;
}

interface TProduct {
 id: string;
 merchantId: string;
 name: string;
 description: string;
 image: string;
 price: number;
 quantity: number;
 category: string;
 subCategory: string;
 status: string;
 additionalData: Record<string, string>;
}

interface ProductSearchQueryParams {
 search?: Query<string>;
 category?: Query<string>;
 pageSize?: Query<number>;
 pageNumber?: Query<number>;
}

interface ProductSearchQueryPagination {
 pageSize?: Query<number>;
 pageNumber?: Query<number>;
}

interface DeleteProductDto {
 productId: string;
}

interface GetASingleProductDto {
 productId: string;
}

interface GetMerchantProductDto {
 merchantId: string;
}

interface GetRelatedProductQueryParam {
 //  productId?: Query<string>;
 //  merchantId?: Query<string>;
 category?: Query<string>;
}

// called by merchants
export const getMerchantProducts = api(
 {
  expose: true,
  auth: true,
  path: "/api/product/merchant",
  method: "GET",
  tags: ["role:merchant"],
 },
 async (): Promise<Response<any>> => {
  const [authdata, error] = getAuth<AuthData>();

  const merchantId = await helper.getMerchantIdFromUser(
   authdata?.userID as string,
  );

  const result = await helper.fetchMerchantProductsFromDb(merchantId);
  return {
   status: "ok",
   message: "merchant products fetched successfully",
   data: result,
  } as Response<any>;
 },
);

export const getSingleProduct = api(
 {
  expose: true,
  auth: true,
  path: "/api/product/:productId",
  method: "GET",
  tags: ["public:view"],
 },
 async (req: GetASingleProductDto) => {
  const [productDetails] = await db
   .select()
   .from(product)
   .where(eq(product.id, req.productId))
   .limit(1);

  return {
   status: "ok",
   message: "A product fetched successfully",
   data: productDetails,
  };
 },
);

export const getRelatedProducts = api(
 {
  expose: true,
  auth: true,
  path: "/api/product/related",
  method: "GET",
 },
 async (params: GetRelatedProductQueryParam) => {
  const filters: SQL[] = [];

  // if (params?.merchantId) {
  //  filters.push(eq(product.merchantId, params.merchantId));
  // }

  // if (params?.productId) {
  //  filters.push(eq(product.id, params.productId));
  // }

  if (params?.category) {
   filters.push(ilike(product.category, params.category));
  }

  const relatedProduct = await db
   .select()
   .from(product)
   .where(and(...filters))
   .limit(5);

  return {
   status: "ok",
   message: "fetched related products",
   data: relatedProduct,
  };
 },
);

// called by user
export const getProductsForMerchants = api(
 {
  expose: true,
  auth: true,
  path: "/api/product/merchant/:merchantId",
  method: "GET",
  tags: ["public:view"],
 },
 async (req: GetMerchantProductDto): Promise<Response<any>> => {
  const result = await helper.fetchMerchantProductsFromDb(req.merchantId);

  return {
   status: "ok",
   message: "merchant products fetched successfully",
   data: result,
  } as Response<any>;
 },
);

export const getLatestProducts = api(
 {
  expose: true,
  auth: false,
  path: "/api/product/latest",
  method: "GET",
  tags: ["public:view"],
 },
 async (params: ProductSearchQueryPagination): Promise<Response<any>> => {
  const limit = Math.min(Math.max(params.pageSize ?? 10, 1), 50);
  const pageNumber = Math.max(params.pageNumber ?? 1, 1);
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

  return {
   status: "ok",
   message: "latest product fetched successfully",
   data: {
    latest: flattenedProducts,
   },
  } as Response<any>;
 },
);

export const getProducts = api(
 {
  expose: true,
  auth: false,
  path: "/api/product",
  method: "GET",
  tags: ["public:view"],
 },
 async (params: ProductSearchQueryParams): Promise<Response<any>> => {
  const limit = Math.min(Math.max(params?.pageSize ?? 10, 1), 50);
  const pageNumber = Math.max(params?.pageNumber ?? 1, 1);
  const offset = (pageNumber - 1) * limit;

  const filters: SQL[] = [eq(product?.status, "available")];

  if (params?.search) {
   filters?.push(
    or(
     ilike(product?.name, `%${params?.search}%`),
     ilike(product?.description, `%${params?.search}%`),
    )!,
   );
  }

  if (params?.category) {
   filters?.push(eq(product?.category, params?.category));
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
   status: "ok",
   message: "all product fetched successfully",
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
  } as Response<any>;
 },
);

export const createProduct = api(
 {
  expose: true,
  auth: true,
  path: "/api/product",
  method: "POST",
  tags: ["role:merchant"],
 },
 async (req: CreateProductDto): Promise<Response<TProduct>> => {
  const [authdata, error] = getAuth<AuthData>();

  const targetMerchantId = await helper.getMerchantIdFromUser(
   authdata?.userID as string,
  );

  const [newProduct] = await db
   .insert(product)
   .values({
    merchantId: targetMerchantId,
    name: req.name,
    description: req.description,
    image: req.image,
    price: req.price,
    quantity: req.quantity,
    category: req.category,
    subCategory: req.subCategory,
    additionalData: req.additionalData,
   })
   .onConflictDoNothing()
   .returning();

  return {
   status: "ok",
   message: "product created successfully",
   data: newProduct,
  } as Response<TProduct>;
 },
);

export const updateProduct = api(
 {
  expose: true,
  auth: true,
  path: "/api/product/:productId",
  method: "PUT",
  tags: ["role:merchant"],
 },
 async (req: UpdateProductDto): Promise<Response<TProduct>> => {
  const [authdata, error] = getAuth<AuthData>();

  const targetMerchantId = await helper.getMerchantIdFromUser(
   authdata?.userID as string,
  );

  const updateData: { [k: string]: any } = {};

  updateData.name = req.name && req.name;
  updateData.description = req.description ?? req.description;
  updateData.image = req.image && req.image;
  updateData.price = req.price && req.price;
  updateData.quantity = req.quantity && req.quantity;
  updateData.category = req.category && req.category;
  updateData.subCategory = req.subCategory && req.subCategory;
  updateData.additionalData = req.additionalData && req.additionalData;
  updateData.updatedAt = new Date();

  const [updatedProduct] = await db
   .update(product)
   .set(updateData)
   .where(
    and(
     eq(product.id, req.productId),
     eq(product.merchantId, targetMerchantId),
    ),
   )
   .returning();

  return {
   status: "ok",
   message: "product updated successfully",
   data: updatedProduct,
  } as Response<TProduct>;
 },
);

export const deleteProduct = api(
 {
  expose: true,
  auth: true,
  path: "/api/product/:productId",
  method: "DELETE",
  tags: ["role:merchant"],
 },
 async (req: DeleteProductDto): Promise<Response<any>> => {
  const [authdata, err] = getAuth<AuthData>();

  const targetMerchantId = await helper.getMerchantIdFromUser(
   authdata?.userID as string,
  );

  await db
   .delete(product)
   .where(
    and(
     eq(product.merchantId, targetMerchantId),
     eq(product.id, req.productId),
    ),
   );

  return {
   status: "ok",
   message: "product deleted successfully",
  } as Response<any>;
 },
);
