/** @format */

import db from "@db/db.ts";
import { user } from "@schema/auth.ts";
import { merchant } from "@schema/merchant.ts";
import { product } from "@schema/product.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import { and, eq, isNotNull } from "drizzle-orm";
import z from "zod";

export const CreateMerchantDto = z.object({
 businessName: z.string(),
 businessLogo: z.string(),
 businessDescription: z.string(),
 address: z.string(),
});

export const UpdateMerchantDto = z.object({
 businessName: z.string().optional(),
 businessLogo: z.string().optional(),
 businessDescription: z.string().optional(),
 address: z.string().optional(),
});

class MerchantService {
 getMerchantIdFromProductId = async (productId: string): Promise<any> => {
  const [productMerchant] = await db
   .select()
   .from(product)
   .innerJoin(merchant, eq(product.merchantId, merchant.id))
   .where(eq(product.id, productId));

  return productMerchant?.merchant;
 };

 getMerchantProfile = async (userId: string) => {
  const [merchantProfile] = await db
   .select()
   .from(merchant)
   .innerJoin(user, eq(merchant.userId, user.id))
   .where(and(eq(merchant?.userId, userId), isNotNull(merchant?.id)))
   .limit(1);

  return merchantProfile;
 };

 createMerchantProfile = async (
  userId: string,
  body: z.infer<typeof CreateMerchantDto>,
 ) => {
  const [existing] = await db
   .select()
   .from(merchant)
   .where(eq(merchant.userId, userId))
   .limit(1);

  if (existing) {
   return [
    null,
    new BadRequestException(
     "A merchant profile already exists for this user.",
     HttpStatus.CONFLICT,
     ErrorCode.ACCESS_UNAUTHORIZED,
    ),
   ];
  }

  const [newMerchant] = await db
   .insert(merchant)
   .values({
    userId: userId,
    businessName: body.businessName,
    businessLogo: body.businessLogo,
    businessDescription: body.businessDescription,
    address: body.address,
   })
   .returning();

  return newMerchant;
 };

 updateMerchantProfile = async (
  userId: string,
  merchantId: string,
  body: z.infer<typeof UpdateMerchantDto>,
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

 deleteMerchantProfile = async (userId: string, merchantId: string) => {
  await db
   .delete(merchant)
   .where(and(eq(merchant.userId, userId), eq(merchant.id, merchantId)));
 };
}

export default new MerchantService();
