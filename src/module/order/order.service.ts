/** @format */
import asError from "@shared/error/as-error.ts";

import db from "@db/db.ts";
import CartService from "@module/cart/cart.service.ts";
import InventoryService from "@module/inventory/inventory.service.ts";
import { user } from "@db/schema/auth.ts";
import { order, orderItem } from "@db/schema/order.ts";
import { product } from "@db/schema/product.ts";
import * as APIError from "@shared/error/APIError.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import {
 Pagination,
 Result,
 TCartItem,
 TMerchantPaginatedOrders,
 TOrder,
 TOrderAndItems,
 TOrderItemsWithProduct,
 TOrderWithUser,
 TUserOrderWithItems,
} from "@shared/types.ts";
import { Mutex } from "async-mutex";
import { and, count, desc, eq, inArray, lt, ne, SQL, sql } from "drizzle-orm";
import { runOnTransactionCommit, Transactional } from "drizzle-transactional";
import FA from "fasy";
import z from "zod";
import {
 getMerchantIdFromProductId,
 getMerchantIdFromUser,
 isLowStock,
 parsePagination,
 validateOrderForCart,
} from "@shared/helper.ts";

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
 ): Promise<Result<TOrderWithUser>> => {
  try {
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

   if (!(result.length > 0)) return [null, null];

   return [result[0], null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 @Transactional()
 async placeOrder(
  userId: string,
  cartId: string,
  body: z.infer<typeof CreateOrderDto>,
 ): Promise<Result<string>> {
  const [data, e] = await CartService.getUserCart(userId, cartId);
  if (e || !data) return [null, e];

  const [result, err] = await mutex.runExclusive(async () => {
   const [orders, e] = await validateOrderForCart(cartId, userId);
   if (e || !orders) return [null, e];

   type OrderItemDraft = {
    productId: string;
    merchantId: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
   };

   const itemResults = await FA.concurrent.map(
    async (v: TCartItem): Promise<OrderItemDraft | [null, Error | null]> => {
     const [productData, e] = await InventoryService.checkProductThreshold(
      v.productId,
     );
     if (e || Number(productData?.quantity) <= 0) return [null, e];

     const [merchantId, err] = await getMerchantIdFromProductId(v.productId);

     if (err || !merchantId) return [null, err];

     return {
      productId: v.productId,
      merchantId,
      quantity: v.quantity,
      unitPrice: v.price,
      lineTotal: v.quantity * v.price,
     };
    },
    data.cart_items || [],
   );

   const validItems = itemResults.filter(
    (i: OrderItemDraft): i is OrderItemDraft => !Array.isArray(i),
   );

   if (validItems.length <= 0) return [null, null];

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
    .values(
     validItems.map((i: OrderItemDraft) => ({ ...i, orderId: newOrder.id })),
    );

   return [
    {
     orderId: newOrder.id,
     productIds: validItems.map((i: OrderItemDraft) => i.productId),
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
  pagination: Pagination = {},
 ): Promise<Result<TUserOrderWithItems[]>> => {
  try {
   const { limit, offset } = parsePagination(pagination);

   const orderRows = await db
    .select({ id: order.id })
    .from(order)
    .where(
     and(eq(order.userId, userId), eq(order.orderStatus, status ?? "pending")),
    )
    .orderBy(desc(order.createdAt))
    .limit(limit)
    .offset(offset);

   if (orderRows.length <= 0) return [[], null];

   const pageOrderIds = orderRows.map((row) => row.id);

   const result = await db
    .select()
    .from(order)
    .innerJoin(orderItem, eq(order.id, orderItem.orderId))
    .innerJoin(product, eq(orderItem.productId, product.id))
    .where(inArray(order.id, pageOrderIds))
    .orderBy(desc(order.createdAt));

   return [
    pageOrderIds.map((orderId) => {
     const orderRows = result.filter((row) => row.orders.id === orderId);

     return {
      orders: orderRows[0].orders,
      order_items: orderRows.map((row) => ({
       ...row.orderItem,
       lineTotal: Number(row.orderItem.lineTotal),
       product: row.product,
       lowStock: isLowStock(Number(row.product.quantity)),
      })),
     };
    }),
    null,
   ];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getOrderDetails = async (
  userId: string,
  orderId: string,
 ): Promise<Result<TOrderAndItems>> => {
  try {
   const result = await db
    .select()
    .from(order)
    .innerJoin(orderItem, eq(order.id, orderItem.orderId))
    .innerJoin(product, eq(orderItem.productId, product.id))
    .where(and(eq(order.id, orderId), eq(order.userId, userId)));

   if (result.length <= 0) return [null, null];

   return [
    {
     order: result[0].orders,
     order_items: result.map(({ orderItem, product }) => ({
      ...orderItem,
      lineTotal: Number(orderItem.lineTotal),
      product,
      lowStock: isLowStock(Number(product.quantity)),
     })),
    },
    null,
   ];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 getMerchantOrders = async (
  userId: string,
  filter: TOrderFilter,
  pagination: Pagination,
 ): Promise<Result<TMerchantPaginatedOrders>> => {
  try {
   const { limit, pageNumber, offset } = parsePagination(pagination);

   const [merchantId, e] = await getMerchantIdFromUser(userId);

   if (e) return [null, e];

   const filters: SQL[] = [eq(orderItem.merchantId, merchantId!)];

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
    .innerJoin(orderItem, eq(order.id, orderItem.orderId))
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
  } catch (err) {
   return [null, asError(err)];
  }
 };

 clearPendingOrders = async (): Promise<Result<void>> => {
  try {
   await db
    .delete(order)
    .where(
     and(
      lt(order.createdAt, sql`now() - interval '1 day'`),
      eq(order.orderStatus, "pending"),
      inArray(
       order.id,
       db.select({ orderId: orderItem.orderId }).from(orderItem),
      ),
     ),
    );

   return [null, null];
  } catch (err) {
   return [null, asError(err)];
  }
 };

 @Transactional()
 async updateOrderStatus(
  userId: string,
  orderId: string,
  status: z.infer<typeof UpdateOrderStatusDto>["status"],
 ): Promise<Result<TOrder>> {
  const [merchantId, e] = await getMerchantIdFromUser(userId);

  if (e || !merchantId) return [null, e];

  const [orderItemForMerchant] = await db
   .select()
   .from(orderItem)
   .where(
    and(eq(orderItem.orderId, orderId), eq(orderItem.merchantId, merchantId)),
   )
   .limit(1);

  if (!orderItemForMerchant) return [null, null];

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
 async cancelOrder(orderId: string): Promise<Result<TOrder>> {
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

   if (!existingOrder) return [null, null];
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
}

export default new OrderService();
