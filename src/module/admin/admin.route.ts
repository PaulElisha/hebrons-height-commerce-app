/** @format */
import authenticate from "@middleware/authenticate.ts";
import roleGuard from "@middleware/role-guard.ts";
import { validate } from "@shared/middleware/validate.ts";
import { Router } from "express";

import AdminController, {
 CategoryIdParams,
 MerchantIdParams,
 OrderIdParams,
 ProductIdParams,
 SubcategoryIdParams,
 UserIdParams,
} from "./admin.controller.ts";
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
  this.router.get(
   "/users/:userId",
   validate(UserIdParams, "params"),
   AdminController.getUser,
  );

  this.router.get("/merchants", AdminController.getMerchants);
  this.router.get(
   "/merchants/:merchantId",
   validate(MerchantIdParams, "params"),
   AdminController.getMerchant,
  );
  this.router.put(
   "/merchants/:merchantId/approval",
   validate(ReviewMerchantDto),
   validate(MerchantIdParams, "params"),
   AdminController.reviewMerchant,
  );

  this.router.get("/orders", AdminController.getOrders);
  this.router.get(
   "/orders/:orderId",
   validate(OrderIdParams, "params"),
   AdminController.getOrderDetails,
  );

  this.router.get("/products", AdminController.getProducts);
  this.router.delete(
   "/products/:productId",
   validate(ProductIdParams, "params"),
   AdminController.deleteProduct,
  );

  this.router.get("/payments", AdminController.getPayments);

  this.router.post(
   "/categories",
   validate(CreateCategoryDto),
   AdminController.createCategory,
  );
  this.router.put(
   "/categories/:categoryId",
   validate(UpdateCategoryDto),
   validate(CategoryIdParams, "params"),
   AdminController.updateCategory,
  );
  this.router.post(
   "/categories/:categoryId/subcategories",
   validate(CreateSubcategoryDto),
   validate(CategoryIdParams, "params"),
   AdminController.createSubcategory,
  );
  this.router.put(
   "/subcategories/:subcategoryId",
   validate(UpdateSubcategoryDto),
   validate(SubcategoryIdParams, "params"),
   AdminController.updateSubcategory,
  );
  this.router.delete(
   "/subcategories/:subcategoryId",
   validate(SubcategoryIdParams, "params"),
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
