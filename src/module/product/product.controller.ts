/** @format */
import { MerchantParams } from "@module/merchant/merchant.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import {
 APIResponse,
 Pagination,
 TProduct,
 UploadImages,
} from "@shared/types.ts";
import { NextFunction, Request, RequestHandler, Response } from "express";

import ProductService, { TProductFilter } from "./product.service.ts";
import z from "zod";
import { product } from "@schema/product.ts";

export interface ProductParams extends RequestHandler {
 productId: string;
}

export const CreateProductSchema = z.object({
 name: z.string(),
 description: z.string(),
 price: z.number(),
 quantity: z.number(),
 category: z.string(),
 subCategory: z.string(),
 additionalData: z.record(z.string(), z.string()),
});

class ProductController {
 getMerchantProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
   req: Request<ProductParams>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const productId = String(req.params.productId);
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
  async (req: Request<MerchantParams>, res: Response, next: NextFunction) => {
   const merchantId = String(req.params.merchantId);

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
  async (req: Request, res: Response, next: NextFunction) => {
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
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
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
   req: Request<any, any, any, Pagination & TProductFilter>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
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
   req: Request<any, any, z.infer<typeof CreateProductSchema>>,
   res: Response<APIResponse<TProduct>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const body = req.body;
   const image = req.upload_image.url;

   const [data, err] = await ProductService.createProduct(userId, {
    ...body,
    image,
   });

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product created successfully",
    data,
   });
  },
 );

 updateProduct = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TProduct>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const productId = String(req.params.productId);
   const body = req.body;

   const [data, err] = await ProductService.updateProduct(
    userId,
    productId,
    body,
   );

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product updated successfully",
    data,
   });
  },
 );

 uploadAdditionalMediaForProduct = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response<APIResponse<TProduct>>,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const productId = String(req.params.productId);
   const imageUrls = req.upload_images;

   const [data, err] = await ProductService.uploadAdditionalMediaForProduct(
    userId,
    productId,
    imageUrls,
   );

   if (err || !data) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product updated successfully",
    data,
   });
  },
 );

 updatePrimaryImage = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
   const userId = req.user.id;
   const productId = String(req.params.productId);
   const primaryImageUrl = req.upload_image.url;

   const [data, e] = await ProductService.updatePrimaryImage(
    userId,
    productId,
    primaryImageUrl,
   );

   if (e || !data) return next(e);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product updated successfully",
    data,
   });
  },
 );

 deleteProduct = asyncHandler(
  async (
   req: Request<ProductParams>,
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const productId = String(req.params.productId);

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
