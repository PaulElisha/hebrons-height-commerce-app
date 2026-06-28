/** @format */

import { Router } from "express";

class UserRouter {
 router: Router;
 constructor() {
  this.router = Router();
 }

 initializeRoutes() {
  this.router.get("/profile");
 }
}
