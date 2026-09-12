/** @format */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
 out: "./drizzle",
 schema: [
  "./src/config/db/schema/auth.ts",
  "./src/config/db/schema/cart.ts",
  "./src/config/db/schema/merchant.ts",
  "./src/config/db/schema/order.ts",
  "./src/config/db/schema/product.ts",
  "./src/config/db/schema/payment.ts",
  "./src/config/db/schema/category.ts",
  "./src/config/db/schema/notification.ts",
  "./src/config/db/schema/outbox.ts",
 ],
 dialect: "postgresql",
 dbCredentials: {
  url: process.env.DB_URL!,
  ssl: {
   rejectUnauthorized: false,
  },
 },
});
