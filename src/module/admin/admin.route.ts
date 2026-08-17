/** @format */
import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@middleware/role-guard.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Router } from "express";

import AdminController from "./admin.controller.ts";
import {
 CreateCategoryDto,
 CreateSubcategoryDto,
 ReviewMerchantDto,
 SendNotificationDto,
 UpdateCategoryDto,
 UpdateSubcategoryDto,
} from "./admin.service.ts";

class AdminRouter {
 router: Router;
 constructor() {
  this.router = Router();
  this.router.use(authenticate);
  this.router.use(roleGuard("admin"));
  this.initializeRoutes();
 }

 initializeRoutes() {
  this.router.get("/analytics", AdminController.getAnalytics);

  this.router.get("/users", AdminController.getUsers);
  this.router.get("/users/:userId", AdminController.getUser);

  this.router.get("/merchants", AdminController.getMerchants);
  this.router.get("/merchants/:merchantId", AdminController.getMerchant);
  this.router.put(
   "/merchants/:merchantId/approval",
   validate(ReviewMerchantDto),
   AdminController.reviewMerchant,
  );

  this.router.get("/orders", AdminController.getOrders);
  this.router.get("/orders/:orderId", AdminController.getOrderDetails);

  this.router.get("/products", AdminController.getProducts);
  this.router.delete("/products/:productId", AdminController.deleteProduct);

  this.router.get("/payments", AdminController.getPayments);

  this.router.post(
   "/categories",
   validate(CreateCategoryDto),
   AdminController.createCategory,
  );
  this.router.put(
   "/categories/:categoryId",
   validate(UpdateCategoryDto),
   AdminController.updateCategory,
  );
  this.router.post(
   "/categories/:categoryId/subcategories",
   validate(CreateSubcategoryDto),
   AdminController.createSubcategory,
  );
  this.router.put(
   "/subcategories/:subcategoryId",
   validate(UpdateSubcategoryDto),
   AdminController.updateSubcategory,
  );
  this.router.delete(
   "/subcategories/:subcategoryId",
   AdminController.deleteSubcategory,
  );

  this.router.post(
   "/notifications",
   validate(SendNotificationDto),
   AdminController.sendNotification,
  );
 }
}

const adminRouter = new AdminRouter().router;
export default adminRouter;
