/** @format */
import FA from "fasy";

import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import { EventContract, EventType } from "@shared/event-bus/config.ts";
import { onEvent } from "@shared/event-bus/consumer.ts";

import InventoryService from "./inventory.service.ts";
onEvent<EventContract>(EventType.ORDER_PLACED).subscribe({
 next: async (payload) => {
  try {
   const { orderId, productIds } = payload.payload;
   console.log("[Inventory update for Order placement]:", {
    product_ids: productIds,
   });

   const results = await FA.concurrent.map(async (productId: any) => {
    return await InventoryService.updateProductThreshold(
     productId,
     orderId,
     "placeOrder",
    );
   }, productIds);

   for (const [_, error] of results) {
    if (error) {
     throw error;
    }
   }
  } catch (error) {
   const formatted = formatErrorPayload(error as Error);
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (error) => {
  console.error(error);
 },
});

onEvent<EventContract>(EventType.ORDER_CANCELLED).subscribe({
 next: async (payload) => {
  try {
   const { orderId, productIds } = payload.payload;
   console.log("[Inventory update for Order cancelled]:", {
    product_ids: productIds,
   });

   await FA.concurrent.map(async (productId: string) => {
    await InventoryService.updateProductThreshold(
     productId,
     orderId,
     "cancelOrder",
    );
   }, productIds);
  } catch (error) {
   const formatted = formatErrorPayload(error as Error);
   console.error("[Background Event Error Intercepted]:", formatted.body);
  }
 },
 error: (error) => {
  console.error(error);
 },
});

export const formatErrorPayload = (err: Error) => {
 if (err instanceof AppError) {
  return {
   status: err.statusCode,
   body: { message: err.message, error: err.errorCode, status: err.statusCode },
  };
 }

 return {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  body: {
   message: "Internal Server error",
   error: err.message || "Unknown error occurred",
   status: "error",
  },
 };
};
