/** @format */

import Env from "@/env.ts";
import cors from "@app/cors.ts";
import helmet from "@app/helmet.ts";
import limiter from "@app/limiter.ts";
import errorHandler from "@middleware/error-handler.ts";
import cartRouter from "@module/cart/cart.route.ts";
import merchantRouter from "@module/merchant/merchant.route.ts";
import productRouter from "@module/product/product.route.ts";
import orderRouter from "@module/order/order.route.ts";
import HttpStatus from "@shared/enum/http.ts";
import express, { Express } from "express";

class App {
 app: Express;
 constructor() {
  this.app = express();
 }

 initializeMiddleware() {
  this.app.disable("x-powered-by");
  this.app.set("trust proxy", 1);

  this.app.use(cors);
  this.app.use(limiter);
  this.app.use(helmet);
  this.app.use(express.json());
  this.app.use(express.urlencoded({ extended: true }));
 }

 // this.app.get("/", (req: Request, res: Response) => {
 //  return res.status(HttpStatus.OK).json("Welcome to the HHG commerce this.app");
 // });

 initializeRoutes() {
  this.app.get("/", (_req, res) => {
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
   console.log(`Server is running on ${Env.HOST}:${Env.PORT}`);
  });
 };
}

const appInstance = new App();
const app = appInstance.app;

// Start server
appInstance.startServer();

export default app;
export { app };
