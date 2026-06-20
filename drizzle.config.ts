/** @format */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
 out: "./module/auth/migrations",
 schema: ["./module/auth/schema.ts"],
 dialect: "postgresql",
});
