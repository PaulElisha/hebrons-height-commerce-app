/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import {
 APIResponse,
 Pagination,
 T,
 TAdminAnalytics,
 TAdminPaginatedMerchants,
 TAdminPaginatedOrders,
 TAdminPaginatedPayments,
 TAdminPaginatedProducts,
 TAdminPaginatedUsers,
 TCategory,
 TMerchantWithUser,
 TOrderAndItems,
 TSubcategory,
 TUserFull,
} from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import AdminService, {
 CreateCategoryDto,
 CreateSubcategoryDto,
 ReviewMerchantDto,
 SendNotificationDto,
 TAdminQuery,
 UpdateCategoryDto,
 UpdateSubcategoryDto,
} from "./admin.service.ts";

export interface AdminParams {
 userId?: string;
 merchantId?: string;
 orderId?: string;
 productId?: string;
 categoryId?: string;
 subcategoryId?: string;
}

class AdminController {
 getAnalytics = asyncHandler(
  async (
   req: Request,
   res: Response<APIResponse<TAdminAnalytics>>,
   next: NextFunction,
  ) => {
   const [data, err] = await AdminService.getAnalytics();

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "admin analytics fetched successfully",
    data,
   });
  },
 );

 getUsers = asyncHandler(
  async (
   req: Request<{}, {}, {}, Pagination & TAdminQuery>,
   res: Response<APIResponse<TAdminPaginatedUsers>>,
   next: NextFunction,
  ) => {
   const pageSizeValue = Number(req.query.pageSize);
   const pageNumberValue = Number(req.query.pageNumber);

   const pagination = {
    pageSize: Number.isFinite(pageSizeValue) ? pageSizeValue : undefined,
    pageNumber: Number.isFinite(pageNumberValue) ? pageNumberValue : undefined,
   };

   const query = {
    search: req.query.search,
   };

   const [data, err] = await AdminService.getUsers(query, pagination);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "users fetched successfully",
    data,
   });
  },
 );

 getUser = asyncHandler(
  async (
   req: Request<AdminParams>,
   res: Response<APIResponse<TUserFull>>,
   next: NextFunction,
  ) => {
   const userId = String(req.params.userId);

   const [data, err] = await AdminService.getUser(userId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "user fetched successfully",
    data,
   });
  },
 );

 getMerchants = asyncHandler(
  async (
   req: Request<{}, {}, {}, Pagination & TAdminQuery>,
   res: Response<APIResponse<TAdminPaginatedMerchants>>,
   next: NextFunction,
  ) => {
   const pageSizeValue = Number(req.query.pageSize);
   const pageNumberValue = Number(req.query.pageNumber);

   const pagination = {
    pageSize: Number.isFinite(pageSizeValue) ? pageSizeValue : undefined,
    pageNumber: Number.isFinite(pageNumberValue) ? pageNumberValue : undefined,
   };

   const query = {
    approvalStatus: req.query.approvalStatus,
   };

   const [data, err] = await AdminService.getMerchants(query, pagination);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchants fetched successfully",
    data,
   });
  },
 );

 getMerchant = asyncHandler(
  async (
   req: Request<AdminParams>,
   res: Response<APIResponse<TMerchantWithUser>>,
   next: NextFunction,
  ) => {
   const merchantId = String(req.params.merchantId);

   const [data, err] = await AdminService.getMerchant(merchantId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "merchant fetched successfully",
    data,
   });
  },
 );

 reviewMerchant = asyncHandler(
  async (
   req: Request<AdminParams, {}, z.infer<typeof ReviewMerchantDto>>,
   res: Response<APIResponse<T<"merchant">>>,
   next: NextFunction,
  ) => {
   const merchantId = String(req.params.merchantId);
   const body = req.body;

   const [data, err] = await AdminService.reviewMerchant(merchantId, body);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: `merchant ${body.approvalStatus} successfully`,
    data,
   });
  },
 );

 getOrders = asyncHandler(
  async (
   req: Request<{}, {}, {}, Pagination & TAdminQuery>,
   res: Response<APIResponse<TAdminPaginatedOrders>>,
   next: NextFunction,
  ) => {
   const pageSizeValue = Number(req.query.pageSize);
   const pageNumberValue = Number(req.query.pageNumber);

   const pagination = {
    pageSize: Number.isFinite(pageSizeValue) ? pageSizeValue : undefined,
    pageNumber: Number.isFinite(pageNumberValue) ? pageNumberValue : undefined,
   };

   const query = {
    orderStatus: req.query.orderStatus,
   };

   const [data, err] = await AdminService.getOrders(query, pagination);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "orders fetched successfully",
    data,
   });
  },
 );

 getOrderDetails = asyncHandler(
  async (
   req: Request<AdminParams>,
   res: Response<APIResponse<TOrderAndItems>>,
   next: NextFunction,
  ) => {
   const orderId = String(req.params.orderId);

   const [data, err] = await AdminService.getOrderDetails(orderId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "order details fetched successfully",
    data,
   });
  },
 );

 getProducts = asyncHandler(
  async (
   req: Request<{}, {}, {}, Pagination & TAdminQuery>,
   res: Response<APIResponse<TAdminPaginatedProducts>>,
   next: NextFunction,
  ) => {
   const pageSizeValue = Number(req.query.pageSize);
   const pageNumberValue = Number(req.query.pageNumber);

   const pagination = {
    pageSize: Number.isFinite(pageSizeValue) ? pageSizeValue : undefined,
    pageNumber: Number.isFinite(pageNumberValue) ? pageNumberValue : undefined,
   };

   const query = {
    search: req.query.search,
   };

   const [data, err] = await AdminService.getProducts(query, pagination);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "products fetched successfully",
    data,
   });
  },
 );

 deleteProduct = asyncHandler(
  async (
   req: Request<AdminParams>,
   res: Response<APIResponse<undefined>>,
   next: NextFunction,
  ) => {
   const productId = String(req.params.productId);

   const [, err] = await AdminService.deleteProduct(productId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "product deleted successfully",
   });
  },
 );

 getPayments = asyncHandler(
  async (
   req: Request<{}, {}, {}, Pagination & TAdminQuery>,
   res: Response<APIResponse<TAdminPaginatedPayments>>,
   next: NextFunction,
  ) => {
   const pageSizeValue = Number(req.query.pageSize);
   const pageNumberValue = Number(req.query.pageNumber);

   const pagination = {
    pageSize: Number.isFinite(pageSizeValue) ? pageSizeValue : undefined,
    pageNumber: Number.isFinite(pageNumberValue) ? pageNumberValue : undefined,
   };

   const query = {
    paymentStatus: req.query.paymentStatus,
   };

   const [data, err] = await AdminService.getPayments(query, pagination);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "payments fetched successfully",
    data,
   });
  },
 );

 createCategory = asyncHandler(
  async (
   req: Request<{}, {}, z.infer<typeof CreateCategoryDto>>,
   res: Response<APIResponse<TCategory>>,
   next: NextFunction,
  ) => {
   const body = req.body;

   const [data, err] = await AdminService.createCategory(body);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "category created successfully",
    data,
   });
  },
 );

 updateCategory = asyncHandler(
  async (
   req: Request<AdminParams, {}, z.infer<typeof UpdateCategoryDto>>,
   res: Response<APIResponse<TCategory>>,
   next: NextFunction,
  ) => {
   const categoryId = String(req.params.categoryId);
   const body = req.body;

   const [data, err] = await AdminService.updateCategory(categoryId, body);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "category updated successfully",
    data,
   });
  },
 );

 createSubcategory = asyncHandler(
  async (
   req: Request<AdminParams, {}, z.infer<typeof CreateSubcategoryDto>>,
   res: Response<APIResponse<TSubcategory>>,
   next: NextFunction,
  ) => {
   const categoryId = String(req.params.categoryId);
   const body = req.body;

   const [data, err] = await AdminService.createSubcategory(categoryId, body);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "subcategory created successfully",
    data,
   });
  },
 );

 updateSubcategory = asyncHandler(
  async (
   req: Request<AdminParams, {}, z.infer<typeof UpdateSubcategoryDto>>,
   res: Response<APIResponse<TSubcategory>>,
   next: NextFunction,
  ) => {
   const subcategoryId = String(req.params.subcategoryId);
   const body = req.body;

   const [data, err] = await AdminService.updateSubcategory(
    subcategoryId,
    body,
   );

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "subcategory updated successfully",
    data,
   });
  },
 );

 deleteSubcategory = asyncHandler(
  async (
   req: Request<AdminParams>,
   res: Response<APIResponse<undefined>>,
   next: NextFunction,
  ) => {
   const subcategoryId = String(req.params.subcategoryId);

   const [, err] = await AdminService.deleteSubcategory(subcategoryId);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "subcategory deleted successfully",
   });
  },
 );

 sendNotification = asyncHandler(
  async (
   req: Request<{}, {}, z.infer<typeof SendNotificationDto>>,
   res: Response<APIResponse<T<"notification">>>,
   next: NextFunction,
  ) => {
   const body = req.body;

   const [data, err] = await AdminService.sendNotification(body);

   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "notification sent successfully",
    data,
   });
  },
 );
}

export default new AdminController();
