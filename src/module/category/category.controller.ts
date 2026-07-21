/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/middleware/async-handler.ts";
import { NextFunction, Request, Response } from "express";

import CategoryService from "./category.service.ts";

export interface CategoryParams {
 categoryId?: string;
}

class CategoryController {
 getCategories = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
   const [data, err] = await CategoryService.getCategories();
   if (err) return next(err);

   return res.status(HttpStatus.OK).json({
    status: "ok",
    message: "categories fetched successfully",
    data,
   });
  },
 );

 deleteCategory = asyncHandler(
  async (req: Request<CategoryParams>, res: Response, next: NextFunction) => {
   const categoryId = String(req.params.categoryId);
   const [, err] = await CategoryService.deleteCategory(categoryId);
   if (err) return next(err);

   return res.status(HttpStatus.NO_CONTENT).send();
  },
 );
}

export default new CategoryController();
