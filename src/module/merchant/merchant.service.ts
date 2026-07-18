/** @format */
import db from "@db/db.ts";
import { user } from "@schema/auth.ts";
import { merchant } from "@schema/merchant.ts";
import { product } from "@schema/product.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import NotFoundException from "@shared/error/not-found.ts";
import { Result, TMerchant, TMerchantWithUser } from "@shared/types.ts";
import { and, eq, isNotNull } from "drizzle-orm";
import z from "zod";

export const CreateMerchantDto = z.object({
 businessName: z.string(),
 businessLogo: z.string().optional(),
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

  getMerchantProfile = async (
   userId: string,
  ): Promise<Result<TMerchantWithUser, AppError>> => {
   const [merchantProfile] = await db
    .select()
    .from(merchant)
    .innerJoin(user, eq(merchant.userId, user.id))
    .where(and(eq(merchant?.userId, userId), isNotNull(merchant?.id)))
    .limit(1);

   if (!merchantProfile) {
    return [
     null,
     new NotFoundException(
      "Merchant profile not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.RESOURCE_NOT_FOUND,
     ),
    ];
   }

   return [merchantProfile, null];
  };

 createMerchantProfile = async (
  userId: string,
  body: z.infer<typeof CreateMerchantDto>,
 ): Promise<Result<TMerchant, AppError>> => {
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
    businessLogo: body.businessLogo || "",
    businessDescription: body.businessDescription,
    address: body.address,
   })
   .returning();

  return [newMerchant, null];
 };

 updateMerchantProfile = async (
  userId: string,
  merchantId: string,
  body: z.infer<typeof UpdateMerchantDto>,
 ): Promise<Result<TMerchant, AppError>> => {
  const updateData: { [k: string]: any } = {};

   if (body.businessName !== undefined) updateData.businessName = body.businessName;
   if (body.businessDescription !== undefined)
    updateData.businessDescription = body.businessDescription;
   if (body.businessLogo !== undefined) updateData.businessLogo = body.businessLogo;
   if (body.address !== undefined) updateData.address = body.address;
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

  if (!updatedMerchant) {
   return [
    null,
    new NotFoundException(
     "Merchant profile not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  return [updatedMerchant, null];
 };

 deleteMerchantProfile = async (
  userId: string,
  merchantId: string,
 ): Promise<Result<void, AppError>> => {
  const [deletedMerchant] = await db
   .delete(merchant)
   .where(and(eq(merchant.userId, userId), eq(merchant.id, merchantId)))
   .returning();

  if (!deletedMerchant) {
   return [
    null,
    new NotFoundException(
     "Merchant profile not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  return [null, null];
 };
}

export default new MerchantService();
