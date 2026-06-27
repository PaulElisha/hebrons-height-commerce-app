/** @format */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
 out: "./drizzle",
 schema: ["./src/config/db/schema.ts"],
 dialect: "postgresql",
 dbCredentials: {
  url: process.env.DB_URL!,
 },
});
