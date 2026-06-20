/** @format */

import { APIError, Gateway, Header } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

import { AuthData } from "../../shared/types.ts";
import betterAuth from "./better-auth.ts";

interface AuthParams {
 cookie: Header<"Cookie">;
}

const handler = authHandler<AuthParams, AuthData>(async (params) => {
 const headers = new Headers();
 if (params.cookie) {
  headers.set("Cookie", params.cookie);
 }

 const session = await betterAuth.api.getSession({ headers });

 if (!session) {
  throw APIError.unauthenticated("invalid session");
 }

 return {
  userID: session.user.id,
  name: session.user.name,
  email: session.user.email,
  role: session.user.role,
 };
});

export const gateway = new Gateway({ authHandler: handler });
