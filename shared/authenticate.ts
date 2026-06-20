/** @format */

import { middleware } from "encore.dev/api";

import { getAuth } from "./get-auth.ts";
import { AuthData } from "./types.ts";

export const auth = middleware(
 { target: { auth: true } },
 async (req, next) => {
  const [authdata, error] = getAuth<AuthData>();

  if (error) throw error;

  return await next(req);
 },
);
