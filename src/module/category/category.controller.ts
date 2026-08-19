/** @format */
import HttpStatus from "@shared/enum/http.ts";
import asyncHandler from "@shared/util/async-handler.ts";
import { APIResponse, TCategory, TSubcategory } from "@shared/types.ts";
import { NextFunction, Request, Response } from "express";
import z from "zod";

import CategoryService from "./category.service.ts";

export const CategoryParams = z.object({
 categoryId: z.string(),
});

class CategoryController {
 getCategories = asyncHandler(
  async (
   req: Request,
   res: Response<
    APIResponse<
     (TCategory & {
      subcategories: TSubcategory[];
     })[]
    >
   >,
   next: NextFunction,
  ) => {
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
  async (req: Request<z.infer<typeof CategoryParams>>, res: Response, next: NextFunction) => {
   const categoryId = req.params.categoryId;
   const [, err] = await CategoryService.deleteCategory(categoryId);
   if (err) return next(err);

   return res.status(HttpStatus.NO_CONTENT).send();
  },
 );
}

export default new CategoryController();
