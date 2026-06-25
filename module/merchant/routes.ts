/** @format */

import { and, eq, isNotNull } from "drizzle-orm";
import { api } from "encore.dev/api";

import { db } from "../../module/auth/db.ts";
import { TUser } from "../../module/auth/routes.ts";
import { user } from "../../schema/auth.ts";
import { merchant } from "../../schema/merchant.ts";
import { getAuth } from "../../shared/get-auth.ts";
import { AuthData, Response } from "../../shared/types.ts";

interface CreateMerchantDto {
 businessName: string;
 businessLogo: string;
 businessDescription: string;
 address: string;
}

interface TMerchant {
 id: string;
 userId: string;
 businessName: string;
 businessLogo: string;
 businessDescription: string;
 address: string;
 approvalStatus: "pending" | "approved" | "rejected";
}

interface UpdateMerchantDto {
 merchantId: string;
 businessName?: string;
 businessLogo?: string;
 businessDescription?: string;
 address?: string;
}

type UserAndMerchant = {
 user: TUser;
 merchant: TMerchant;
};

export const getMerchantProfile = api(
 {
  expose: true,
  auth: true,
  path: "/api/merchant",
  method: "GET",
  tags: ["role:merchant"],
 },
 async (): Promise<Response<UserAndMerchant>> => {
  const [authdata, error] = getAuth<AuthData>();

  const [merchantProfile] = await db
   .select()
   .from(merchant)
   .innerJoin(user, eq(merchant?.userId, user?.id))
   .where(
    and(
     eq(merchant?.userId, authdata?.userID as string),
     isNotNull(merchant?.id),
    ),
   )
   .limit(1);

  return {
   status: "ok",
   message: "fetched merchant profile",
   data: merchantProfile,
  } as Response<UserAndMerchant>;
 },
);

export const createMerchantProfile = api(
 {
  expose: true,
  auth: true,
  path: "/api/merchant",
  method: "POST",
  tags: ["role:merchant"],
 },
 async (req: CreateMerchantDto): Promise<Response<TMerchant>> => {
  const [authdata, error] = getAuth<AuthData>()!;
  if (error) return error;

  const [newMerchant] = await db
   .insert(merchant)
   .values({
    userId: authdata?.userID as string,
    businessName: req.businessName,
    businessLogo: req.businessLogo,
    businessDescription: req.businessDescription,
    address: req.address,
   })
   .onConflictDoNothing()
   .returning();

  return {
   status: "ok",
   message: "merchant created successfully",
   data: newMerchant,
  } as Response<TMerchant>;
 },
);

export const updateMerchantProfile = api(
 {
  expose: true,
  auth: true,
  path: "/api/merchant/:merchantId",
  method: "PUT",
  tags: ["role:merchant"],
 },
 async (req: UpdateMerchantDto): Promise<Response<TMerchant>> => {
  const [authdata, error] = getAuth<AuthData>();

  const [existingMerchant] = await db
   .select()
   .from(merchant)
   .innerJoin(user, eq(merchant.userId, authdata?.userID as string))
   .where(and(eq(merchant.id, req.merchantId), isNotNull(merchant.id)));

  const updateData: { [k: string]: any } = {};

  updateData.businessName = req.businessName && req.businessName;
  updateData.businessDescription =
   req.businessDescription && req.businessDescription;
  updateData.businessLogo = req.businessLogo && req.businessLogo;
  updateData.address = req.address && req.address;
  updateData.updatedAt = new Date();

  const [updatedMerchant] = await db
   .update(merchant)
   .set(updateData)
   .where(
    and(
     eq(merchant.userId, authdata?.userID as string),
     isNotNull(merchant.id),
    ),
   )
   .returning();

  return {
   status: "ok",
   message: "merchant updated successfully",
   data: updatedMerchant,
  } as Response<TMerchant>;
 },
);

export const deleteMerchantProfile = api(
 {
  expose: true,
  auth: true,
  path: "/api/merchant/:merchantId",
  method: "DELETE",
  tags: ["role:admin"],
 },
 async (req: { merchantId: string }): Promise<Response<any>> => {
  const [authdata, error] = getAuth<AuthData>();

  await db
   .delete(merchant)
   .where(
    and(
     eq(merchant.userId, authdata?.userID as string),
     eq(merchant.id, req.merchantId),
    ),
   );

  return {
   status: "ok",
   message: "merchant deleted successfully",
  };
 },
);
