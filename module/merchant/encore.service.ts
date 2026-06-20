/** @format */

import { middleware } from "encore.dev/api";
import { Service } from "encore.dev/service";

import { getAuth } from "../../shared/get-auth";
import { AuthData } from "../../shared/types";

// if (authData?.data?.role !== "merchant") {
//  throw APIError.permissionDenied("Only merchants can manage products");
// }

export default new Service("merchant", {
 middlewares: [
  middleware({ target: { auth: true } }, async (req, next) => {
   const [authdata, error] = getAuth<AuthData>();

   if (error) throw error;

   return await next(req);
  }),
 ],
});
