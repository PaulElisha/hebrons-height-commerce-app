/** @format */
import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@middleware/role-guard.ts";
import { Router } from "express";

import CategoryController from "./category.controller.ts";

class CategoryRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/", CategoryController.getCategories);
  this.router.delete(
   "/:categoryId",
   authenticate,
   roleGuard("admin"),
   CategoryController.deleteCategory,
  );
 }
}

const categoryRouter = new CategoryRouter().router;
export default categoryRouter;
