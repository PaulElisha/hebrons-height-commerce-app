/** @format */
import AppError from "@shared/error/app-error.ts";
import { Result } from "@shared/types.ts";

class AdminService {
 createAdminAccount = async (): Promise<Result<void, AppError>> => {
  return [null, null];
 };
}

export default new AdminService();
