/** @format */

import { middleware } from "encore.dev/api";
import { Service } from "encore.dev/service";

import { getAuth } from "../../shared/get-auth";
import { AuthData } from "../../shared/types";

export default new Service("product", {
 middlewares: [
  middleware({ target: { auth: true } }, async (req, next) => {
   const [authdata, error] = getAuth<AuthData>();

   if (error) throw error;

   return await next(req);
  }),
 ],
});
