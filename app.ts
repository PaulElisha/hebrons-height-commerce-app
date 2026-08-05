/** @format */
import "@module/email/consumer.ts";
import "@module/inventory/consumer.ts";
import "@module/merchant/consumer.ts";
import "@module/notification/consumer.ts";
import "@module/payment/consumer.ts";

import cors from "@app/cors.ts";
import helmet from "@app/helmet.ts";
import limiter from "@app/limiter.ts";
import logger from "@app/logger.ts";
import spec, { options } from "@app/swagger.ts";
import { auth } from "@auth/auth.ts";
import db, { pool } from "@db/db.ts";
import HttpStatus from "@enum/http.ts";
import errorHandler from "@middleware/error-handler.ts";
import cartRouter from "@module/cart/cart.route.ts";
import categoryRouter from "@module/category/category.route.ts";
import merchantRouter from "@module/merchant/merchant.route.ts";
import notificationRouter from "@module/notification/notification.route.ts";
import orderRouter from "@module/order/order.route.ts";
import paymentRouter from "@module/payment/payment.routes.ts";
import productRouter from "@module/product/product.route.ts";
import uploadRouter from "@module/upload/upload.route.ts";
import userRouter from "@module/user/user.routes.ts";
import cloudinaryWebhookRouter from "@module/webhook/cloudinary/cloudinary.route.ts";
import paystackWebhookRouter from "@module/webhook/paystack/paystack.routes.ts";
import stripeWebhookRouter from "@module/webhook/stripe/stripe.route.ts";
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import dns from "dns";
import { sql } from "drizzle-orm";
import {
 addTransactionalDrizzleDatabase,
 initializeDrizzleTransactionalContext,
} from "drizzle-transactional";
import express, { Express } from "express";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";

import Env from "./env.ts";

dns.setDefaultResultOrder("ipv4first");

initializeDrizzleTransactionalContext();
addTransactionalDrizzleDatabase(db as any);

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
  this.app.use(pinoHttp({ logger }));
  this.app.use(limiter);
  this.app.use(helmet);
  this.app.use(cookieParser());
  this.initializeAuthRoutes();
  this.app.use(express.json({ limit: "10mb" }));
  this.app.use(express.urlencoded({ limit: "10mb", extended: true }));
 }

 initializeAuthRoutes() {
  this.app.all("/api/auth/*splat", toNodeHandler(auth));
 }

 initializeWebhooks() {
  this.app.use("/api/webhook", stripeWebhookRouter);
  this.app.use("/api/webhook", paystackWebhookRouter);
  this.app.use("/api/webhook", cloudinaryWebhookRouter);
 }

 initializeApiRoutes() {
  const startTime = Date.now();

  this.app.get("/health", async (_req, res) => {
   let dbStatus = "disconnected";
   try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
   } catch {
    dbStatus = "disconnected";
   }

   res
    .status(
     dbStatus === "connected" ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    )
    .json({
     status: dbStatus === "connected" ? "ok" : "degraded",
     db: dbStatus,
     uptime: Math.floor((Date.now() - startTime) / 1000),
     timestamp: new Date().toISOString(),
    });
  });

  this.app.use("/api/user", userRouter);
  this.app.use("/api/merchant", merchantRouter);
  this.app.use("/api/category", categoryRouter);
  this.app.use("/api/notification", notificationRouter);
  this.app.use("/api/product", productRouter);
  this.app.use("/api/cart", cartRouter);
  this.app.use("/api/order", orderRouter);
  this.app.use("/api/payment", paymentRouter);
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
  const server = this.app.listen(Env.PORT, () => {
   logger.info(`Server is running on ${Env.BASE_URL}`);
  });

  // OutboxService.replayUnprocessed().then((count) => {
  //  if (count > 0) logger.info(`Replayed ${count} unprocessed outbox events.`);
  // });

  // const outboxTimer = setInterval(() => {
  //  OutboxService.replayUnprocessed();
  // }, 5_000).unref();

  const shutdown = (signal: string) => {
   logger.info({ signal }, "Shutting down gracefully...");
   //  clearInterval(outboxTimer);

   server.close(() => {
    logger.info("HTTP server closed.");

    pool
     .end()
     .then(() => {
      logger.info("Database pool closed.");
      process.exit(0);
     })
     .catch((err) => {
      logger.error({ err }, "Error closing database pool");
      process.exit(1);
     });
   });

   setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
   }, 30_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
 };
}

const appInstance = new App();
const app = appInstance.app;

// Start server
appInstance.startServer();

export default app;
export { app };
