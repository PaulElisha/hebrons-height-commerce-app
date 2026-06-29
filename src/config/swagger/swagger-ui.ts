import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import spec from "./swagger.ts";

export const setupSwagger = (app: Express) => {
 app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(spec, {
   explorer: true,
   customSiteTitle: "HHG Commerce API Docs",
  }),
 );

 app.get("/api/docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(spec);
 });
};
