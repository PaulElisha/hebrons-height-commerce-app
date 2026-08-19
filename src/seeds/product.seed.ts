/** @format */

import "../../env.ts";

import db from "@db/db.ts";
import { account, user } from "@db/schema/auth.ts";
import { category, subcategory } from "@db/schema/category.ts";
import { merchant } from "@db/schema/merchant.ts";
import { product } from "@db/schema/product.ts";
import { hashPassword } from "@shared/util/password.ts";
import { and, eq } from "drizzle-orm";

const DEMO_USER = {
 id: crypto.randomUUID(),
 name: "Demo Merchant",
 email: "demo@merchant.com",
 emailVerified: true,
 role: "merchant" as const,
 createdAt: new Date(),
 updatedAt: new Date(),
};

const DEMO_PASSWORD = "password123";

const CATEGORIES = [
 { name: "Electronics", subs: ["Phones", "Laptops", "Accessories"] },
 { name: "Clothing", subs: ["Men", "Women", "Kids"] },
 { name: "Home & Kitchen", subs: ["Appliances", "Cookware", "Furniture"] },
 { name: "Books", subs: ["Fiction", "Non-Fiction", "Educational"] },
 { name: "Sports", subs: ["Fitness", "Outdoor", "Equipment"] },
];

const PRODUCTS = [
 {
  name: "Wireless Bluetooth Earbuds",
  description:
   "Noise-cancelling earbuds with 24hr battery life. IPX5 water resistant.",
  price: 15000,
  quantity: 50,
  cat: 0,
  sub: 0,
 },
 {
  name: "iPhone 15 Pro Max Case",
  description:
   "Premium silicone case with MagSafe compatibility. Drop-proof up to 2m.",
  price: 5500,
  quantity: 100,
  cat: 0,
  sub: 2,
 },
 {
  name: "Men's Classic Fit Polo",
  description: "100% cotton pique polo shirt. Available in multiple colors.",
  price: 8500,
  quantity: 75,
  cat: 1,
  sub: 0,
 },
 {
  name: "Women's Running Leggings",
  description: "High-waist compression leggings with moisture-wicking fabric.",
  price: 12000,
  quantity: 60,
  cat: 1,
  sub: 1,
 },
 {
  name: "Stainless Steel Blender",
  description: "1000W blender with 6 stainless steel blades. BPA-free pitcher.",
  price: 35000,
  quantity: 30,
  cat: 2,
  sub: 1,
 },
 {
  name: "Memory Foam Desk Chair",
  description:
   "Ergonomic office chair with lumbar support and adjustable armrests.",
  price: 85000,
  quantity: 20,
  cat: 2,
  sub: 2,
 },
 {
  name: "The Art of War",
  description:
   "Sun Tzu's classic strategy text. New annotated edition with commentary.",
  price: 4500,
  quantity: 120,
  cat: 3,
  sub: 1,
 },
 {
  name: "JavaScript: The Good Parts",
  description: "Douglas Crockford's guide to writing clean JavaScript.",
  price: 7000,
  quantity: 40,
  cat: 3,
  sub: 2,
 },
 {
  name: "Adjustable Dumbbell Set",
  description:
   "Space-saving adjustable weights from 2kg to 24kg. Quick-change dial system.",
  price: 95000,
  quantity: 15,
  cat: 4,
  sub: 0,
 },
 {
  name: "Camping Hammock",
  description:
   "Double-size parachute hammock with tree straps. Holds up to 250kg.",
  price: 18000,
  quantity: 45,
  cat: 4,
  sub: 1,
 },
];

async function seedProducts() {
 let merchantUser = await db
  .select()
  .from(user)
  .where(eq(user.email, DEMO_USER.email))
  .limit(1)
  .then((r) => r[0]);

 if (!merchantUser) {
  merchantUser = await db
   .insert(user)
   .values(DEMO_USER)
   .returning()
   .then((r) => r[0]);
  console.log("Created user:", merchantUser.email);
 } else if (merchantUser.role !== "merchant") {
  [merchantUser] = await db
   .update(user)
   .set({ role: "merchant", updatedAt: new Date() })
   .where(eq(user.id, merchantUser.id))
   .returning();
  console.log("Updated user role to merchant:", merchantUser.email);
 }

 const existingPasswords = await db
  .select()
  .from(account)
  .where(eq(account.userId, merchantUser.id))
  .limit(1);

 if (existingPasswords.length <= 0) {
  const hashed = await hashPassword(DEMO_PASSWORD);
  await db.insert(account).values({
   id: crypto.randomUUID(),
   accountId: merchantUser.email,
   providerId: "email",
   userId: merchantUser.id,
   password: hashed,
   createdAt: new Date(),
   updatedAt: new Date(),
  });
  console.log("Created password account for user");
 }

 let store = await db
  .select()
  .from(merchant)
  .where(eq(merchant.userId, merchantUser.id))
  .limit(1)
  .then((r) => r[0]);

 if (!store) {
  store = await db
   .insert(merchant)
   .values({
    userId: merchantUser.id,
    businessName: "Demo Store",
    businessLogo: "https://via.placeholder.com/150",
    businessDescription: "Demo store for product seeding",
    address: "123 Seed Street",
    approvalStatus: "approved",
   })
   .returning()
   .then((r) => r[0]);
  console.log("Created merchant:", store.businessName);
 }

 for (const catDef of CATEGORIES) {
  let [cat] = await db
   .select()
   .from(category)
   .where(eq(category.name, catDef.name))
   .limit(1);

  if (!cat) {
   [cat] = await db
    .insert(category)
    .values({ name: catDef.name, description: `${catDef.name} products` })
    .returning();
  }

  for (const subName of catDef.subs) {
   const [existing] = await db
    .select()
    .from(subcategory)
    .where(
     and(eq(subcategory.categoryId, cat.id), eq(subcategory.name, subName)),
    )
    .limit(1);
   if (!existing) {
    await db
     .insert(subcategory)
     .values({ categoryId: cat.id, name: subName })
     .returning();
   }
  }
 }

 await db.delete(product).where(eq(product.merchantId, store.id));

 const cats = await db.select().from(category);
 const subs = await db.select().from(subcategory);

 const catsByName = new Map(cats.map((c) => [c.name, c]));
 const subsByKey = new Map(subs.map((s) => [`${s.categoryId}::${s.name}`, s]));

 const imageBase = "https://picsum.photos/seed";

 const productsToInsert = PRODUCTS.map((p, i) => {
  const cat = catsByName.get(CATEGORIES[p.cat].name)!;
  const sub = subsByKey.get(`${cat.id}::${CATEGORIES[p.cat].subs[p.sub]}`)!;

  return {
   merchantId: store.id,
   name: p.name,
   description: p.description,
   image: `${imageBase}/prod${i + 1}/400/400`,
   price: p.price,
   quantity: p.quantity,
   categoryId: cat.id,
   subCategoryId: sub.id,
   category: cat.name,
   subCategory: sub.name,
   status: "available" as const,
   additionalData: { material: "various" },
  };
 });

 await db.insert(product).values(productsToInsert).returning();

 console.log(`Seeded ${PRODUCTS.length} products`);
 for (const p of PRODUCTS) {
  console.log(`  - ${p.name} (₦${p.price})`);
 }

 process.exit(0);
}

seedProducts().catch((err) => {
 console.error("Seed failed:", err);
 process.exit(1);
});
