/** @format */

import db from "@db/db.ts";
import { user } from "@schema/auth.ts";
import { merchant } from "@schema/merchant.ts";
import { and, eq, isNotNull } from "drizzle-orm";

export const getMerchantProfile = async (userId: string) => {
 const [merchantProfile] = await db
  .select()
  .from(merchant)
  .innerJoin(user, eq(merchant?.userId, userId))
  .where(and(eq(merchant?.userId, userId), isNotNull(merchant?.id)))
  .limit(1);

 return merchantProfile;
};

export const createMerchantProfile = async (
 userId: string,
 body: {
  businessName: string;
  businessLogo: string;
  businessDescription: string;
  address: string;
 },
) => {
 const [newMerchant] = await db
  .insert(merchant)
  .values({
   userId,
   businessName: body.businessName,
   businessLogo: body.businessLogo,
   businessDescription: body.businessDescription,
   address: body.address,
  })
  .onConflictDoNothing()
  .returning();

 return newMerchant;
};

export const updateMerchantProfile = async (
 userId: string,
 merchantId: string,
 body: {
  businessName: string;
  businessLogo: string;
  businessDescription: string;
  address: string;
 },
) => {
 const updateData: { [k: string]: any } = {};

 updateData.businessName = body.businessName && body.businessName;
 updateData.businessDescription =
  body.businessDescription && body.businessDescription;
 updateData.businessLogo = body.businessLogo && body.businessLogo;
 updateData.address = body.address && body.address;
 updateData.updatedAt = new Date();

 const [updatedMerchant] = await db
  .update(merchant)
  .set(updateData)
  .where(
   and(
    eq(merchant.userId, userId),
    eq(merchant.id, merchantId),
    isNotNull(merchant.id),
   ),
  )
  .returning();

 return updatedMerchant;
};

export const deleteMerchantProfile = async (
 userId: string,
 merchantId: string,
) => {
 await db
  .delete(merchant)
  .where(and(eq(merchant.userId, userId), eq(merchant.id, merchantId)));
};
