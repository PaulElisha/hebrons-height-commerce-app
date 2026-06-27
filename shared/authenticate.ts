/** @format */

import { APIError, middleware } from "encore.dev/api";

import { getAuth } from "./get-auth.ts";
import { AuthData } from "./types.ts";

export function requiredRoles(targetTag: string, ...roles: Array<string>) {
 return middleware(
  {
   target: { auth: true, tags: [targetTag] },
  },
  async (req, next) => {
   const [authdata, error] = getAuth<AuthData>();

   if (error) throw error;

   if (!roles.includes(authdata?.role as string))
    throw APIError.permissionDenied("Permission denied!");

   return await next(req);
  },
 );
}
