/** @format */

import db from "@db/db.ts";
import CartService from "@module/cart/cart.service.ts";
import { user } from "@schema/auth.ts";
import { order, orderItem } from "@schema/order.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import AppError from "@shared/error/app-error.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import NotFoundException from "@shared/error/not-found.ts";
import { EventType } from "@shared/event-bus/config.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";
import * as helper from "@shared/helper.ts";
import { Mutex } from "async-mutex";
import {
 Pagination,
 Result,
 TCartItem,
 TOrder,
 TOrderAndItems,
 TOrderJoinRow,
 TOrderWithUser,
 TMerchantPaginatedOrders,
} from "@shared/types.ts";

const mutex = new Mutex();
import { and, count, desc, eq, isNotNull, lt, ne, SQL, sql } from "drizzle-orm";
import { runOnTransactionCommit, Transactional } from "drizzle-transactional";
import FA from "fasy";
import z from "zod";

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

  if (!(result.length > 0)) {
   return [
    null,
    new NotFoundException(
     `Order with ID ${orderId} not found`,
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

  return [result[0], null];
 };

 @Transactional()
 async placeOrder(
  userId: string,
  cartId: string,
  body: z.infer<typeof CreateOrderDto>,
 ): Promise<Result<string, AppError>> {
  const [data, err] = await CartService.getUserCart(userId, cartId);
  if (err || !data) return [null, err];

  const [orderExists] = await helper.validateOrderForCart(cartId, userId);

  if (orderExists) {
   return [
    null,
    new BadRequestException(
     "Order already created",
     HttpStatus.UNPROCESSABLE_ENTITY,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];
  }

  const [result, e] = await mutex.runExclusive(async () => {
   const [newOrder] = await db
    .insert(order)
    .values({
     userId,
     cartId,
     subtotal: data.cart.subtotal as number,
     deliveryAddress: {
      label: "home",
      address: body.deliveryAddress.address,
      city: body.deliveryAddress.city,
      state: body.deliveryAddress.state,
      country: body.deliveryAddress.country,
      line1: body.deliveryAddress.line1,
      line2: body.deliveryAddress.line2,
     } as any,
    })
    .returning();

   const itemsToInsert = await FA.concurrent.map(async (v: TCartItem) => {
    const [productData, e] = await helper.getProductThreshold(v.productId);
    if (e || !productData) return null;

    const [merchantId, err] = await helper.getMerchantIdFromProductId(
     v.productId,
    );
    if (err || !merchantId) return null;

    return {
     orderId: newOrder.id,
     productId: v.productId,
     merchantId,
     quantity: v.quantity,
     unitPrice: v.price,
     lineTotal: v.quantity * v.price,
    };
   }, data.cart_items || []);

   const validItems = itemsToInsert.filter(Boolean);

   if (validItems.length <= 0) {
    return [
     null,
     new NotFoundException(
      "Item not found in cart",
      HttpStatus.NOT_FOUND,
      ErrorCode.RESOURCE_NOT_FOUND,
     ),
    ];
   }

   await db.insert(orderItem).values(validItems);

   return [
    {
     orderId: newOrder.id,
     productIds: validItems.map((i: any) => i.productId),
    },
    null,
   ];
  });

  if (e) return [null, e];

  runOnTransactionCommit(() => {
   PublishEvent({
    event_type: EventType.ORDER_PLACED,
    payload: {
     userId,
     cartId,
     orderId: result?.orderId,
     productIds: result?.productIds,
    },
   });
  });

  return [result?.orderId, null];
 }

 getUserOrderByStatus = async (
  userId: string,
  status: string,
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
   return [
    null,
    new NotFoundException(
     `${status} order not found`,
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];

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

  if (!(result.length > 0)) {
   return [
    null,
    new NotFoundException(
     "order not found",
     HttpStatus.NOT_FOUND,
     ErrorCode.RESOURCE_NOT_FOUND,
    ),
   ];
  }

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
  filter: {
   status?: string;
  },
  pagination: Pagination,
  ): Promise<Result<TMerchantPaginatedOrders, AppError>> => {
   const [merchantId, err] = await helper.getMerchantIdFromUser(userId);
   if (err || !merchantId) return [null, err];

  const limit = Math.min(Math.max(pagination.pageSize ?? 10, 1), 50);
  const pageNumber = Math.max(pagination.pageNumber ?? 1, 1);
  const offset = (pageNumber - 1) * limit;

  const filters: SQL[] = [eq(orderItem.merchantId, merchantId)];

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
   .where(and(...filters, isNotNull(order.id)));

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

 clearPendingOrders = async () => {
  await db
   .delete(order)
   .where(
    and(
     lt(order.createdAt, sql`now() - interval '1 day'`),
     eq(order.orderStatus, "pending"),
     eq(orderItem.orderId, order.id),
    ),
   );
 };

 @Transactional()
 async cancelOrder(orderId: string): Promise<Result<TOrder, AppError>> {
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

   if (!existingOrder) {
    return [
     null,
     new NotFoundException(
      "Order not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.RESOURCE_NOT_FOUND,
     ),
    ];
   }

   if (existingOrder.orderStatus === "cancelled") {
    return [
     null,
     new BadRequestException(
      "Order already cancelled",
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.VALIDATION_ERROR,
     ),
    ];
   }

   return [
    null,
    new BadRequestException(
     "Cannot cancel a paid order",
     HttpStatus.UNPROCESSABLE_ENTITY,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];
  }

  const productIds = (
   await db
    .select({ productId: orderItem.productId })
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId))
  ).map((item) => item.productId);

  runOnTransactionCommit(() => {
   PublishEvent({
    event_type: EventType.ORDER_CANCELLED,
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

  if (!existingOrder) {
   return [
    null,
    new BadRequestException(
     "Invalid order",
     HttpStatus.BAD_REQUEST,
     ErrorCode.VALIDATION_ERROR,
    ),
   ];
  }

  await db.delete(orderItem).where(eq(orderItem.orderId, orderId));
  await db.delete(order).where(eq(order.id, orderId));

  return [null, null];
 }
}

export default new OrderService();
