/** @format */
import { MerchantParams } from "@module/merchant/merchant.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { Pagination, UploadImages } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";

import ProductService from "./product.service.ts";

export interface ProductParams {
 productId?: string;
}

class ProductController {
 getMerchantProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
   const userId = req.user.id;
   const data = await ProductService.getMerchantProducts(userId);

   res.status(HttpStatus.OK).json({
    status: "ok",
    messsage: "fetched merchant products",
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
   const productId = req.params.productId as string;
   const data = await ProductService.getSingleProduct(productId);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched a product",
    data,
   });
  },
 );

 getProductForMerchant = asyncHandler(
  async (req: Request<MerchantParams>, res: Response, next: NextFunction) => {
   const merchantId = req.params.merchantId as string;

   const data = await ProductService.getProductForMerchant(merchantId);

   res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched product for merchant",
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

   const data = await ProductService.getLatestProducts(pagination);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "fetched latest products",
    data,
   });
  },
 );

 getProducts = asyncHandler(
  async (
   req: Request<
    any,
    any,
    any,
    Pagination & {
     search?: string;
     category?: string;
    }
   >,
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
   };

   const data = await ProductService.getProducts(filters, pagination);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "products fetched successfully",
    data,
   });
  },
 );

 createProduct = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
   const userId = req.user.id;
   const body = req.body;
   const image = req.upload_image.url;

   const data = await ProductService.createProduct(userId, {
    ...body,
    image,
   });

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
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const productId = req.params.productId as string;
   const body = req.body;

   const data = await ProductService.updateProduct(userId, productId, body);

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
   res: Response,
   next: NextFunction,
  ): Promise<any> => {
   const userId = req.user.id;
   const productId = req.params.productId as string;
   const imageUrls = req.upload_images as UploadImages;

   const data = await ProductService.uploadAdditionalMediaForProduct(
    userId,
    productId,
    imageUrls,
   );

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
   const productId = req.params.productId as string;

   await ProductService.deleteProduct(userId, productId);
   return res.status(HttpStatus.NO_CONTENT).json({
    status: "ok",
    message: "product deleted successfully",
   });
  },
 );
}

export default new ProductController();
