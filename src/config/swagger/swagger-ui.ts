/** @format */

import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

import spec from "./swagger.ts";

export const setupSwagger = (app: Express) => {
 const options: Record<string, unknown> = {
  explorer: true,
  customSiteTitle: "HHG Commerce API Docs",
  urls: [
   {
    name: "App API",
    url: "/api/docs.json",
   },
   {
    name: "Auth (Better Auth)",
    url: "/api/auth/reference/openapi.json",
   },
  ],
 };

 app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(null as any, options as any),
 );

 app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(spec);
 });
};
