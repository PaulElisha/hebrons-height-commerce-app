/** @format */
import db from "@db/db.ts";
import { user } from "@db/schema/auth.ts";
import { merchant } from "@db/schema/merchant.ts";
import { product } from "@db/schema/product.ts";
import * as APIError from "@shared/error/APIError.ts";
import { getMerchantIdFromUser } from "@shared/helper.ts";
import { AssetType, Result } from "@shared/types.ts";
import { eq, sql } from "drizzle-orm";

export interface CloudinaryWebhookPayload {
 public_id: string;
 secure_url: string;
}

export type FolderHandler = (
 payload: CloudinaryWebhookPayload,
 userId: string,
) => Promise<Result<unknown>>;

export const CloudinaryFolderActions: Record<AssetType, FolderHandler> = {
 profile: async ({ secure_url }, userId) => {
  const [profile] = await db
   .select()
   .from(user)
   .where(eq(user.id, userId))
   .limit(1);

  if (!profile)
   return [null, APIError.forbidden("Image cannot be uploaded, Invalid user")];

  const [updatedProfile] = await db
   .update(user)
   .set({ image: secure_url })
   .where(eq(user.id, userId))
   .returning();

  return [updatedProfile, null];
 },
 product: async ({ secure_url }, userId) => {
  const [merchantId, err] = await getMerchantIdFromUser(userId);
  if (err || !merchantId) return [null, err];

  const [merchantProduct] = await db
   .select()
   .from(product)
   .where(eq(product.merchantId, merchantId))
   .limit(1);

  if (!merchantProduct)
   return [
    null,
    APIError.forbidden("Product cannot be uploaded, Invalid merchant"),
   ];

  const [updatedProduct] = await db
   .update(product)
   .set({ image: secure_url })
   .where(eq(product.merchantId, merchantId))
   .returning();

  return [updatedProduct, null];
 },
 business: async ({ secure_url }, userId) => {
  const [merchantId, err] = await getMerchantIdFromUser(userId);
  if (err || !merchantId) return [null, err];

  const [store] = await db
   .select()
   .from(merchant)
   .where(eq(merchant.id, merchantId))
   .limit(1);

  if (!store)
   return [
    null,
    APIError.forbidden("Image cannot be uploaded, Invalid merchant"),
   ];

  const [updatedMerchant] = await db
   .update(merchant)
   .set({ businessLogo: secure_url })
   .where(eq(merchant.id, merchantId))
   .returning();

  return [updatedMerchant, null];
 },
 additional: async ({ secure_url }, userId) => {
  const [merchantId, err] = await getMerchantIdFromUser(userId);
  if (err || !merchantId) return [null, err];

  const [merchantProduct] = await db
   .select()
   .from(product)
   .where(eq(product.merchantId, merchantId))
   .limit(1);

  if (!merchantProduct)
   return [
    null,
    APIError.forbidden("Product cannot be uploaded, Invalid merchant"),
   ];

  const [updatedProduct] = await db
   .update(product)
   .set({
    additionalImages: sql`COALESCE(${product.additionalImages}, '[]'::jsonb) || ${JSON.stringify([secure_url])}::jsonb`,
   })
   .where(eq(product.merchantId, merchantId))
   .returning();

  return [updatedProduct, null];
 },
};
