/** @format */

import { toNodeHandler } from "better-auth/node";
import { api } from "encore.dev/api";

import betterAuth from "./better-auth.ts";
import { UserRole } from "../../schema/auth.ts";

export interface TUser {
 name: string;
 email: string;
 emailVerified: boolean;
 image: string;
 role: string;
}

export const route = api.raw(
 { expose: true, path: "/auth/*path", method: "*" },
 toNodeHandler(betterAuth),
);
