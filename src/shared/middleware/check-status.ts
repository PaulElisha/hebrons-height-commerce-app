/** @format */
import db from "@db/db.ts";
import { user } from "@db/schema/auth.ts";
import { merchant } from "@db/schema/merchant.ts";
import * as APIError from "@shared/error/APIError.ts";
import { getMerchantIdFromUser } from "@shared/helper.ts";
import { and, eq, isNull } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

export const checkMerchantStatus = (status: string) => {
 return async (req: Request, res: Response, next: NextFunction) => {
  try {
   const userId = req.user.id;

   const [merchantId, err] = await getMerchantIdFromUser(userId);

   if (err || !merchantId) return next(err);

   const result = await db
    .select()
    .from(merchant)
    .where(and(eq(merchant.id, merchantId), isNull(merchant.deletedAt)))
    .then((r) => r[0]);

   if (status !== result.approvalStatus)
    return next(
     APIError.unauthorized(
      `Resource not accessible to merchant of ${result.approvalStatus} status`,
     ),
    );

   next();
  } catch (err) {
   next(err);
  }
 };
};
