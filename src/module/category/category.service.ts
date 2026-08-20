/** @format */
import asError from "@shared/error/as-error.ts";
import db from "@db/db.ts";
import { category, subcategory } from "@db/schema/category.ts";
import { Result, TCategory, TSubcategory } from "@shared/types.ts";
import { eq } from "drizzle-orm";
import FA from "fasy";

class CategoryService {
 getCategories = async (): Promise<
  Result<(TCategory & { subcategories: TSubcategory[] })[]>
 > => {
  try {
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
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getCategoryByName = async (name: string): Promise<Result<TCategory>> => {
  try {
   const [existing] = await db
    .select()
    .from(category)
    .where(eq(category.name, name))
    .limit(1);

   if (!existing) return [null, null];

   return [existing, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 deleteCategory = async (categoryId: string): Promise<Result<void>> => {
  try {
   const [deleted] = await db
    .delete(category)
    .where(eq(category.id, categoryId))
    .returning();

   if (!deleted) return [null, null];

   return [null, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };
}

export default new CategoryService();
