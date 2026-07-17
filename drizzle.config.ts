/** @format */
import { defineConfig } from "drizzle-kit";
export default defineConfig({
 out: "./drizzle",
 schema: [
  "./src/schema/auth.ts",
  "./src/schema/cart.ts",
  "./src/schema/merchant.ts",
  "./src/schema/order.ts",
  "./src/schema/product.ts",
  "./src/schema/payment.ts",
 ],
 dialect: "postgresql",
 dbCredentials: {
  url: process.env.DB_URL!,
  ssl: {
   rejectUnauthorized: false,
  },
 },
});
