/** @format */
import { MerchantParams } from "@module/merchant/merchant.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import {
 APIResponse,
 Pagination,
 TCategory,
 TMerchantProducts,
 TPaginatedProducts,
 TProduct,
 TProductWithMerchant,
 TSubcategory,
} from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import ProductService, {
 CreateProductDto,
 TProductFilter,
 UpdateProductDto,
} from "./product.service.ts";

export const ProductParams = z.object({
 productId: z.string(),
});

class ProductController {
 getMerchantProduct = asyncHandler(
  async (
   req: Request,
   res: Response<APIResponse<TMerchantProducts>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const [data, err] = await ProductService.getMerchantProducts(userId);

   if (err) return next(err);

   res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched merchant products",
    data,
   });
  },
 );

 getSingleProduct = asyncHandler(
  async (
   req: Request<z.infer<typeof ProductParams>>,
   res: Response<APIResponse<TProduct>>,
   next: NextFunction,
  ) => {
   const productId = req.params.productId;
   const [data, err] = await ProductService.getSingleProduct(productId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched a product",
    data,
   });
  },
 );

 getProductForMerchant = asyncHandler(
  async (
   req: Request<z.infer<typeof MerchantParams>>,
   res: Response<APIResponse<TMerchantProducts>>,
   next: NextFunction,
  ) => {
   const merchantId = req.params.merchantId;

   const [data, err] = await ProductService.getProductForMerchant(merchantId);

   if (err) return next(err);

   res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched product for merchant",
    data,
   });
  },
 );

 getProductsByCategories = asyncHandler(
  async (
   req: Request,
   res: Response<
    APIResponse<
     {
      category: TCategory;
      subcategories: {
       subcategory: TSubcategory;
       products: TProduct[];
      }[];
     }[]
    >
   >,
   next: NextFunction,
  ) => {
   const [data, err] = await ProductService.getProductsByCategories();
   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "products by categories fetched successfully",
    data,
   });
  },
 );

 getLatestProducts = asyncHandler(
  async (
   req: Request<{}, {}, {}, Pagination>,
   res: Response<APIResponse<TProductWithMerchant[]>>,
   next: NextFunction,
  ) => {
   const pageSizeValue = Number(req.query.pageSize);
   const pageNumberValue = Number(req.query.pageNumber);

   const pagination = {
    pageSize: Number.isFinite(pageSizeValue) ? pageSizeValue : undefined,
    pageNumber: Number.isFinite(pageNumberValue) ? pageNumberValue : undefined,
   };

   const [data, err] = await ProductService.getLatestProducts(pagination);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched latest products",
    data,
   });
  },
 );

 getProducts = asyncHandler(
  async (
   req: Request<{}, {}, {}, Pagination & TProductFilter>,
   res: Response<APIResponse<TPaginatedProducts>>,
   next: NextFunction,
  ) => {
   const pageSizeValue = Number(req.query.pageSize);
   const pageNumberValue = Number(req.query.pageNumber);

   const pagination = {
    pageSize: Number.isFinite(pageSizeValue) ? pageSizeValue : undefined,
    pageNumber: Number.isFinite(pageNumberValue) ? pageNumberValue : undefined,
   };

   const filters = {
    search: req.query.search,
    category: req.query.category,
    subCategory: req.query.subCategory,
   };

   const [data, err] = await ProductService.getProducts(filters, pagination);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "products fetched successfully",
    data,
   });
  },
 );

 createProduct = asyncHandler(
  async (
   req: Request<{}, {}, z.infer<typeof CreateProductDto>>,
   res: Response<APIResponse<TProduct>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const body = req.body;

   const [data, err] = await ProductService.createProduct(userId, body);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product created successfully",
    data,
   });
  },
 );

 updateProduct = asyncHandler(
  async (
   req: Request<
    z.infer<typeof ProductParams>,
    {},
    z.infer<typeof UpdateProductDto>
   >,
   res: Response<APIResponse<TProduct>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId;
   const body = req.body;

   const [data, err] = await ProductService.updateProduct(
    userId,
    productId,
    body,
   );

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product updated successfully",
    data,
   });
  },
 );

 deleteProduct = asyncHandler(
  async (
   req: Request<z.infer<typeof ProductParams>>,
   res: Response<APIResponse<undefined>>,
   next: NextFunction,
  ) => {
   const userId = req.user.id;
   const productId = req.params.productId;

   const [, err] = await ProductService.deleteProduct(userId, productId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product deleted successfully",
   });
  },
 );
}

export default new ProductController();
