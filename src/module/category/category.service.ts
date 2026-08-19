/** @format */
import db from "@db/db.ts";
import { category, subcategory } from "@db/schema/category.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { Result, TCategory, TSubcategory } from "@shared/types.ts";
import { eq } from "drizzle-orm";
import FA from "fasy";

class CategoryService {
 getCategories = async (): Promise<
  Result<(TCategory & { subcategories: TSubcategory[] })[], AppError>
 > => {
  const categories = await db.select().from(category).orderBy(category.name);

  const result = await FA.concurrent.map(async (category: TCategory) => {
   const subs = await db
    .select()
    .from(subcategory)
    .where(eq(subcategory.categoryId, category.id))
    .orderBy(subcategory.name);
   return { ...category, subcategories: subs };
  }, categories);

  return [result, null];
 };

 getCategoryByName = async (
  name: string,
 ): Promise<Result<TCategory, AppError>> => {
  const [existing] = await db
   .select()
   .from(category)
   .where(eq(category.name, name))
   .limit(1);

  if (!existing) return [null, null];

  return [existing, null];
 };

 deleteCategory = async (
  categoryId: string,
 ): Promise<Result<void, AppError>> => {
  const [deleted] = await db
   .delete(category)
   .where(eq(category.id, categoryId))
   .returning();

  if (!deleted) return [null, null];

  return [null, null];
 };
}

export default new CategoryService();
