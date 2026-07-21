/** @format */
import authenticate from "@middleware/authenticate.ts";
import { Router } from "express";

import { validate } from "@shared/middleware/validate.ts";
import { Subscription } from "../webpush/config.ts";
import WebpushController from "./webpush.controller.ts";

class WebPushRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.post(
   "/subscribe",
   validate(Subscription),
   WebpushController.subscribe,
  );
  this.router.post("/unsubscribe", WebpushController.unsubscribe);
 }
}

const webpushRouter = new WebPushRouter().router;
export default webpushRouter;
