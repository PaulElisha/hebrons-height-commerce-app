/** @format */

import "@module/email/consumer.ts";
import "@module/inventory/consumer.ts";
import "@module/merchant/consumer.ts";
import "@module/payment/consumer.ts";

import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import express, { Express, Request } from "express";
import swaggerUi from "swagger-ui-express";

import cors from "@app/cors.ts";
import helmet from "@app/helmet.ts";
import limiter from "@app/limiter.ts";
import spec, { options } from "@app/swagger.ts";
import { auth } from "@auth/auth.ts";
import cartRouter from "@module/cart/cart.route.ts";
import merchantRouter from "@module/merchant/merchant.route.ts";
import orderRouter from "@module/order/order.route.ts";
import paymentRouter from "@module/payment/payment.routes.ts";
import productRouter from "@module/product/product.route.ts";
import uploadRouter from "@module/upload/upload.route.ts";
import userRouter from "@module/user/user.routes.ts";
import stripeWebhookRouter from "@module/webhook/stripe/stripe.route.ts";

import HttpStatus from "@enum/http.ts";
import errorHandler from "@middleware/error-handler.ts";

import Env from "./env.ts";
import paystackWebhookRouter from "@module/webhook/paystack/paystack.routes.ts";

class App {
 app: Express;
 constructor() {
  this.app = express();
  this.app.disable("x-powered-by");
  this.app.set("trust proxy", 1);
  this.initializeWebhooks();
  this.initializeMiddlewares();
  this.initializeApiRoutes();
 }

 initializeMiddlewares() {
  this.app.use(cors);
  this.app.use(limiter);
  this.app.use(helmet);
  this.app.use(cookieParser());
  this.initializeAuthRoutes();
  this.app.use(
   express.json({
    verify: (req: Request, res, buf) => {
     if (req.url?.includes("/webhook/paystack")) {
      req.rawBody = buf.toString("utf8");
     }
    },
   }),
  );
  this.app.use(express.urlencoded({ extended: true }));
 }

 initializeAuthRoutes() {
  this.app.all("/api/auth/*splat", toNodeHandler(auth));
 }

 initializeWebhooks() {
  this.app.use("/api/stripe", stripeWebhookRouter);
 }

 initializeApiRoutes() {
  this.app.get("/health", (_req, res) => {
   res.status(HttpStatus.OK).send("Welcome to Hebrons Height Commerce APP");
  });

  this.app.use("/api/user", userRouter);
  this.app.use("/api/merchant", merchantRouter);
  this.app.use("/api/product", productRouter);
  this.app.use("/api/cart", cartRouter);
  this.app.use("/api/order", orderRouter);
  this.app.use("/api/payment", paymentRouter);
  this.app.use("/api/paystack", paystackWebhookRouter);
  this.app.use("/api/upload", uploadRouter);

  this.app.use(
   "/api/docs",
   swaggerUi.serve,
   swaggerUi.setup(spec, options as any),
  );

  this.app.get("/api/docs.json", (_req, res) => {
   res.setHeader("Content-Type", "application/json");
   res.send(spec);
  });

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
