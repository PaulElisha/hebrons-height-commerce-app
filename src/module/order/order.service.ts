/** @format */

import db from "@db/db.ts";
import CartService from "@module/cart/cart.service.ts";
import { user } from "@schema/auth.ts";
import { order, orderItem } from "@schema/order.ts";
import ErrorCode from "@shared/enum/error-code.ts";
import HttpStatus from "@shared/enum/http.ts";
import BadRequestException from "@shared/error/bad-request.ts";
import { EventType } from "@shared/event-bus/config.ts";
import { PublishEvent } from "@shared/event-bus/publisher.ts";
import * as helper from "@shared/helper.ts";
import {
 Pagination,
 TCartItem,
 TOrder,
 TOrderAndItems,
 Transaction,
} from "@shared/types.ts";
import { Mutex } from "async-mutex";
import { and, count, desc, eq, isNotNull, lt, ne, SQL, sql } from "drizzle-orm";
import FA from "fasy";

interface CreateOrderDto {
 deliveryAddress: Record<string, string>;
}

const mutex = new Mutex();

class OrderService {
 getOrderWithUser = async (orderId: string) => {
  const [result] = await db
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
   .where(eq(order.id, orderId));

  if (!result) {
   throw new Error(`Order with ID ${orderId} not found`);
  }

  return result;
 };

 placeOrder = async (
  userId: string,
  cartId: string,
  body: CreateOrderDto,
 ): Promise<string> => {
  const data = await CartService.getUserCart(userId, cartId);

  // const [orderExists] = await helper.validateOrderForCart(cartId, userId);

  // if (orderExists) {
  //  throw new BadRequestException(
  //   "Order already created",
  //   HttpStatus.UNPROCESSABLE_ENTITY,
  //   ErrorCode.VALIDATION_ERROR,
  //  );
  // }

  const { orderId, productIds } = await mutex.runExclusive(async () => {
   return await db.transaction(async (tx: Transaction) => {
    const [newOrder] = await tx
     .insert(order)
     .values({
      userId,
      cartId,
      subtotal: data?.cart?.subtotal as number,
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
     .onConflictDoNothing()
     .returning();

    const itemsToInsert = await FA.concurrent.map(async (v: TCartItem) => {
     const merchantId = await helper.getMerchantIdFromProductId(
      tx,
      v.productId,
     );

     return {
      orderId: newOrder?.id,
      productId: v.productId,
      merchantId,
      quantity: v.quantity,
      unitPrice: v.price,
      lineTotal: v.quantity * v.price,
     };
    }, data?.cart_items || []);

    const productIds = itemsToInsert.map((item: TCartItem) => item.productId);

    if (itemsToInsert.length > 0) {
     await tx.insert(orderItem).values(itemsToInsert);
    }

    return { orderId: newOrder.id, productIds };
   });
  });

  PublishEvent({
   event_type: EventType.ORDER_PLACED,
   payload: {
    userId,
    cartId,
    orderId,
    productIds,
   },
  });

  return orderId;
 };

 getUserOrderByStatus = async (
  userId: string,
  status: string,
 ): Promise<TOrderAndItems> => {
  const result = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(
    and(
     eq(order.userId, userId),
     eq(order.orderStatus, status ?? "pending"),
     eq(order.id, orderItem.orderId),
    ),
   )
   .orderBy(desc(order.createdAt));

  return {
   order: result[0].orders,
   order_items: result.filter((i) => i.orderItem).map((o) => o.orderItem),
  };
 };

 getOrderDetails = async (
  userId: string,
  orderId: string,
 ): Promise<TOrderAndItems> => {
  const result = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(and(eq(order.id, orderId), eq(order.userId, userId)));

  return {
   order: result[0].orders,
   order_items: result.filter((i) => i.orderItem).map((o) => o.orderItem),
  };
 };

 getMerchantOrders = async (
  userId: string,
  filter: {
   status?: string;
  },
  pagination: Pagination,
 ): Promise<any> => {
  const merchantId = await helper.getMerchantIdFromUser(userId);

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

  return {
   fetchedOrders,
   pagination: {
    limit,
    pageNumber,
    totalOrders,
    totalPages,
    offset,
   },
  };
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

 cancelOrder = async (orderId: string): Promise<TOrder> => {
  return await db.transaction(async (tx: Transaction) => {
   const [existingOrder] = await tx
    .select({ orderStatus: order.orderStatus })
    .from(order)
    .where(eq(order.id, orderId));

   if (existingOrder?.orderStatus === "cancelled") {
    throw new BadRequestException(
     "Order already cancelled",
     HttpStatus.UNPROCESSABLE_ENTITY,
     ErrorCode.VALIDATION_ERROR,
    );
   }

   const [cancelledOrder] = await tx
    .update(order)
    .set({
     orderStatus: "cancelled",
     paymentStatus: "cancelled",
    })
    .where(and(eq(order.id, orderId), ne(order.paymentStatus, "paid")))
    .returning();

   const items = await tx
    .select({
     productId: orderItem.productId,
    })
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId));

   const productIds = items.map((item) => item.productId);

   PublishEvent({
    event_type: EventType.ORDER_CANCELLED,
    payload: {
     productIds,
     orderId: cancelledOrder?.id,
    },
   });

   return cancelledOrder;
  });
 };

 deleteOrderItem = async (orderId: string) => {
  const [existingOrder] = await db
   .select()
   .from(order)
   .where(eq(order.id, orderId));

  if (!existingOrder)
   throw new BadRequestException(
    "Invalid order",
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_ERROR,
   );

  await db.transaction(async (tx) => {
   await tx.delete(orderItem).where(eq(orderItem.orderId, orderId));

   await tx.delete(order).where(eq(order.id, orderId));
  });
 };
}

export default new OrderService();