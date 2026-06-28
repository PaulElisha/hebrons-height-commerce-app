/** @format */

import Env from "./env";
import cors from "./src/config/app/cors";
import helmet from "./src/config/app/helmet";
import limiter from "./src/config/app/limiter";
import errorHandler from "./src/shared/middleware/error-handler";
import cartRouter from "./src/module/cart/cart.route";
import merchantRouter from "./src/module/merchant/merchant.route";
import productRouter from "./src/module/product/product.route";
import orderRouter from "./src/module/order/order.route";
import HttpStatus from "./src/shared/enum/http";
import express, { Express } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/config/auth/auth";

class App {
 app: Express;
 constructor() {
  this.app = express();
  this.app.disable("x-powered-by");
  this.app.set("trust proxy", 1);
  this.initializeMiddleware();
 }

 initializeMiddleware() {
  this.app.use(cors);
  this.app.use(limiter);
  this.app.use(helmet);
  this.initializeAuthRoute();
  this.app.use(express.json());
  this.app.use(express.urlencoded({ extended: true }));
  this.initializeRoutes();
 }

 initializeAuthRoute() {
  this.app.all("/api/auth/*splat", toNodeHandler(auth));
 }

 initializeRoutes() {
  this.app.get("/health", (_req, res) => {
   res.status(HttpStatus.OK).send("Welcome to Hebrons Height Commerce APP");
  });

  this.app.use("/api/merchant", merchantRouter);
  this.app.use("/api/product", productRouter);
  this.app.use("/api/cart", cartRouter);
  this.app.use("/api/order", orderRouter);

  this.app.use(errorHandler);
 }

 startServer = async () => {
  this.app.listen(Env.PORT, () => {
   console.log(`Server is running on ${Env.BASE_URL}`);
  });
 };
}

const appInstance = new App();
const app = appInstance.app;

// Start server
appInstance.startServer();

export default app;
export { app };
