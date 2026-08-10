/** @format */

import db from "@db/db.ts";
import CartService from "@module/cart/cart.service.ts";
import InventoryService from "@module/inventory/inventory.service.ts";
import { user } from "@schema/auth.ts";
import { order, orderItem } from "@schema/order.ts";
import * as APIError from "@shared/error/APIError.ts";
import AppError from "@shared/error/app-error.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import * as helper from "@shared/helper.ts";
import {
 Pagination,
 Result,
 T,
 TCartItem,
 TMerchantPaginatedOrders,
 TOrderAndItems,
 TOrderJoinRow,
 TOrderWithUser,
} from "@shared/types.ts";
import { Mutex } from "async-mutex";
import { and, count, desc, eq, inArray, lt, ne, SQL, sql } from "drizzle-orm";
import { runOnTransactionCommit, Transactional } from "drizzle-transactional";
import FA from "fasy";
import z from "zod";

const mutex = new Mutex();

export const OrderStatusQuery = z.object({
 status: z.string().optional(),
});
export type TOrderStatusQuery = z.infer<typeof OrderStatusQuery>;

export const OrderFilter = z.object({
 status: z.string().optional(),
});
export type TOrderFilter = z.infer<typeof OrderFilter>;

export const UpdateOrderStatusDto = z.object({
 status: z.enum(["out_for_delivery", "delivered"]),
});

export const CreateOrderDto = z.object({
 deliveryAddress: z.object({
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  line1: z.string(),
  line2: z.string().optional(),
 }),
});

class OrderService {
 getOrderWithUser = async (
  userId: string,
  orderId: string,
 ): Promise<Result<TOrderWithUser, AppError>> => {
  const result = await db
   .select({
    id: order.id,
    subtotal: order.subtotal,
    deliveryAddress: order.deliveryAddress,
    createdAt: order.createdAt,
    user: {
     id: user.id,
     email: user.email,
     name: user.name,
    },
   })
   .from(order)
   .innerJoin(user, eq(order.userId, user.id))
   .where(and(eq(order.id, orderId), eq(order.userId, userId)));

  if (!(result.length > 0))
   return [null, APIError.notFound(`Order with ID ${orderId} not found`)];

  return [result[0], null];
 };

 @Transactional()
 async placeOrder(
  userId: string,
  cartId: string,
  body: z.infer<typeof CreateOrderDto>,
 ): Promise<Result<string, AppError>> {
  const [data, e] = await CartService.getUserCart(userId, cartId);
  if (e || !data) return [null, e];

  const [result, err] = await mutex.runExclusive(async () => {
   const [orders, e] = await helper.validateOrderForCart(cartId, userId);
   if (e || !orders) return [null, e];

   const itemResults = await FA.concurrent.map(async (v: TCartItem) => {
    const [productData, e] = await InventoryService.checkProductThreshold(
     v.productId,
    );
    if (e || Number(productData?.quantity) <= 0) return [null, e];

    const [merchantId, err] = await helper.getMerchantIdFromProductId(
     v.productId,
    );

    if (err || !merchantId) return [null, err];

    return {
     productId: v.productId,
     merchantId,
     quantity: v.quantity,
     unitPrice: v.price,
     lineTotal: v.quantity * v.price,
    };
   }, data.cart_items || []);

   const validItems = itemResults.filter(Boolean);

   if (validItems.length <= 0)
    return [null, APIError.notFound("Item not found in cart")];

   const [newOrder] = await db
    .insert(order)
    .values({
     userId,
     cartId,
     subtotal: Number(data.cart.subtotal),
     deliveryAddress: {
      label: "home",
      address: body.deliveryAddress.address,
      city: body.deliveryAddress.city,
      state: body.deliveryAddress.state,
      country: body.deliveryAddress.country,
      line1: body.deliveryAddress.line1,
      line2: body.deliveryAddress.line2 ?? "",
     },
    })
    .returning();

   await db
    .insert(orderItem)
    .values(validItems.map((i: any) => ({ ...i, orderId: newOrder.id })));

   return [
    {
     orderId: newOrder.id,
     productIds: validItems.map((i: any) => i.productId),
    },
    null,
   ];
  });

  if (err) return [null, err];

  runOnTransactionCommit(() => {
   publishEvent({
    event_type: EventType.ORDER_PLACED,
    userId,
    payload: {
     cartId,
     orderId: result?.orderId,
     productIds: result?.productIds,
    },
   });
  });

  if (!result) return [null, null];

  return [result?.orderId, null];
 }

 getUserOrderByStatus = async (
  userId: string,
  status?: string,
 ): Promise<Result<TOrderJoinRow[], AppError>> => {
  const result = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(
    and(eq(order.userId, userId), eq(order.orderStatus, status ?? "pending")),
   )
   .orderBy(desc(order.createdAt));

  if (!(result.length > 0))
   return [null, APIError.notFound(`${status} order not found`)];

  return [result, null];
 };

 getOrderDetails = async (
  userId: string,
  orderId: string,
 ): Promise<Result<TOrderAndItems, AppError>> => {
  const result = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(and(eq(order.id, orderId), eq(order.userId, userId)));

  if (result.length <= 0) return [null, APIError.notFound("order not found")];

  return [
   {
    order: result[0].orders,
    order_items: result.filter((i) => i.orderItem).map((o) => o.orderItem),
   },
   null,
  ];
 };

 getMerchantOrders = async (
  userId: string,
  filter: TOrderFilter,
  pagination: Pagination,
 ): Promise<Result<TMerchantPaginatedOrders, AppError>> => {
  const { limit, pageNumber, offset } = helper.parsePagination(pagination);

  const filters: SQL[] = [
   eq(orderItem.merchantId, helper.merchantIdSubquery(userId)),
  ];

  if (filter?.status) {
   filters?.push(eq(order?.orderStatus, filter?.status)!);
  }

  const fetchedOrders = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(and(...filters))
   .limit(limit)
   .offset(offset)
   .orderBy(desc(order.createdAt));

  const [totalCountResult] = await db
   .select({ totalCount: count() })
   .from(order)
   .where(and(...filters));

  const totalOrders = Number(totalCountResult?.totalCount);
  const totalPages = Math.ceil(totalOrders / limit);

  return [
   {
    fetchedOrders,
    pagination: {
     limit,
     pageNumber,
     totalOrders,
     totalPages,
     offset,
    },
   },
   null,
  ];
 };

 clearPendingOrders = async (): Promise<Result<void, AppError>> => {
  try {
   await db
    .delete(order)
    .where(
     and(
      lt(order.createdAt, sql`now() - interval '1 day'`),
      eq(order.orderStatus, "pending"),
      eq(orderItem.orderId, order.id),
     ),
    );

   return [null, null];
  } catch (err) {
   return [null, APIError.internalServer("Failed to clear pending orders")];
  }
 };

 @Transactional()
 async updateOrderStatus(
  userId: string,
  orderId: string,
  status: z.infer<typeof UpdateOrderStatusDto>["status"],
 ): Promise<Result<T<"order">, AppError>> {
  const [orderItemForMerchant] = await db
   .select()
   .from(orderItem)
   .where(
    and(
     eq(orderItem.orderId, orderId),
     inArray(orderItem.merchantId, helper.merchantIdSubquery(userId)),
    ),
   )
   .limit(1);

  if (!orderItemForMerchant)
   return [null, APIError.notFound("Order not found for this merchant")];

  const [updatedOrder] = await db
   .update(order)
   .set({
    orderStatus: status,
    updatedAt: new Date(),
   })
   .where(
    and(
     eq(order.id, orderId),
     status === "out_for_delivery"
      ? eq(order.orderStatus, "processing")
      : eq(order.orderStatus, "out_for_delivery"),
    ),
   )
   .returning();

  if (!updatedOrder) {
   return [
    null,
    APIError.badRequest(
     status === "out_for_delivery"
      ? "Order must be in processing status to mark as out for delivery"
      : "Order must be out for delivery to mark as delivered",
    ),
   ];
  }

  runOnTransactionCommit(() => {
   publishEvent({
    event_type: EventType.ORDER_STATUS_UPDATED,
    userId: updatedOrder.userId,
    payload: {
     orderId,
     status,
     message: `Your order is now ${status.replace("_", " ")}`,
    },
   });
  });

  return [updatedOrder, null];
 }

 @Transactional()
 async cancelOrder(orderId: string): Promise<Result<T<"order">, AppError>> {
  const [cancelledOrder] = await db
   .update(order)
   .set({
    orderStatus: "cancelled",
    paymentStatus: "cancelled",
   })
   .where(
    and(
     eq(order.id, orderId),
     ne(order.orderStatus, "cancelled"),
     ne(order.paymentStatus, "paid"),
    ),
   )
   .returning();

  if (!cancelledOrder) {
   const [existingOrder] = await db
    .select({ orderStatus: order.orderStatus })
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1);

   if (!existingOrder) return [null, APIError.notFound("Order not found")];
   if (existingOrder.orderStatus === "cancelled")
    return [null, APIError.badRequest("Order already cancelled")];

   return [null, APIError.badRequest("Cannot cancel a paid order")];
  }

  const productIds = (
   await db
    .select({ productId: orderItem.productId })
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId))
  ).map((item) => item.productId);

  runOnTransactionCommit(() => {
   publishEvent({
    event_type: EventType.ORDER_CANCELLED,
    userId: cancelledOrder.userId,
    payload: {
     productIds,
     orderId: cancelledOrder.id,
    },
   });
  });

  return [cancelledOrder, null];
 }

 @Transactional()
 async deleteOrderItem(orderId: string): Promise<Result<void, AppError>> {
  const [existingOrder] = await db
   .select()
   .from(order)
   .where(eq(order.id, orderId));

  if (!existingOrder) return [null, APIError.badRequest("Invalid order")];

  await db.delete(orderItem).where(eq(orderItem.orderId, orderId));
  await db.delete(order).where(eq(order.id, orderId));

  return [null, null];
 }
}

export default new OrderService();
