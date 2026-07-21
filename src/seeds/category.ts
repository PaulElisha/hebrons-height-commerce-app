/** @format */

import db from "../config/db/db.ts";
import { category } from "@schema/category.ts";
import { subcategory } from "@schema/category.ts";
import { and, eq } from "drizzle-orm";

interface CategorySeed {
 name: string;
 description: string;
 subcategories: string[];
}

const categories: CategorySeed[] = [
 {
  name: "Car",
  description: "Vehicles and automobiles",
  subcategories: ["Foreign Used", "Nigerian Used"],
 },
 {
  name: "Real Estate",
  description: "Properties and land",
  subcategories: ["Landed Property", "House"],
 },
 {
  name: "Food",
  description: "Food and provisions",
  subcategories: ["Raw", "Cooked"],
 },
 {
  name: "Jewelry",
  description: "Jewelry and accessories",
  subcategories: ["Ring", "Earring"],
 },
 {
  name: "Services",
  description: "Professional services",
  subcategories: ["Consultation"],
 },
];

export async function seedCategories() {
 for (const cat of categories) {
  let [existing] = await db
   .select()
   .from(category)
   .where(eq(category.name, cat.name))
   .limit(1);

  if (!existing) {
   [existing] = await db
    .insert(category)
    .values({ name: cat.name, description: cat.description })
    .returning();
   console.log(`Seeded category: ${cat.name}`);
  }

  for (const subName of cat.subcategories) {
   const [subExists] = await db
    .select()
    .from(subcategory)
    .where(
     and(
      eq(subcategory.categoryId, existing.id),
      eq(subcategory.name, subName),
     ),
    )
    .limit(1);

   if (!subExists) {
    await db
     .insert(subcategory)
     .values({ categoryId: existing.id, name: subName });
    console.log(`  Seeded subcategory: ${subName}`);
   }
  }
 }
}

seedCategories()
 .then(() => console.log("Seeding complete"))
 .catch((err) => console.log("Seeding failed", err));
