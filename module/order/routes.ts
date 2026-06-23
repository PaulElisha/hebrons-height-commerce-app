/** @format */

import { api, Query } from "encore.dev/api";
import { eq, and, or, SQL, desc, isNotNull, ne, lt, sql } from "drizzle-orm";

import { db } from "../../module/auth/db";
import { cart, cartItem } from "../../schema/cart";
import { getAuth } from "../../shared/get-auth";
import { AuthData, Response, TOrder, TOrderItem } from "../../shared/types";
import { order, orderItem, paymentStatuses } from "../../schema/order";
import * as CartAPI from "../cart/routes";
import { TCartAndItem, TCartItem } from "../../shared/types";
import { TOrderAndItem } from "../../shared/types";
import * as helper from "../../shared/helper";
import { index } from "drizzle-orm/gel-core";

interface CreateOrderDto {
 deliveryAddress: Record<string, string>;
}

interface GetOrderDetailsDto {
 orderId: string;
}

interface OrderSearchByStatusQuery {
 status?: Query<string>;
}

interface DeleteOrderDto {
 orderId: string;
}

interface OrderSearchQueryPagination {
 pageSize?: Query<number>;
 pageNumber?: Query<number>;
}

export const placeOrder = api(
 {
  expose: true,
  auth: true,
  path: "/api/order",
  method: "POST",
 },
 async (req: CreateOrderDto): Promise<Response<TOrder>> => {
  const [authdata, error] = getAuth<AuthData>();

  const data: Response<TCartAndItem> = await CartAPI.getUserCart();

  const [newOrder] = await db
   .insert(order)
   .values({
    userId: authdata?.userID as string,
    cartId: data.data?.cart?.id as string,
    subtotal: data.data?.cart?.subtotal as number,
    deliveryAddress: {
     label: "home",
     address: req.deliveryAddress.address,
     city: req.deliveryAddress.city,
     state: req.deliveryAddress.state,
     country: req.deliveryAddress.country,
     line1: req.deliveryAddress.line1,
     line2: req.deliveryAddress.line2,
    } as any,
   })
   .returning();

  const itemsToInsert = await Promise.all(
   ((data.data as any)?.cart_items || []).map(async (v: TCartItem) => {
    const merchantId = await helper.getMerchantIdFromProductId(v.productId);

    return {
     orderId: newOrder?.id,
     productId: v.productId,
     merchantId,
     quantity: v.quantity,
     unitPrice: v.price,
     lineTotal: v.quantity * v.price,
    };
   }),
  );

  if (itemsToInsert.length > 0) {
   await db.insert(orderItem).values(itemsToInsert);
  }

  return {
   status: "ok",
   message: "order placed successfully",
   data: { orderId: newOrder.id },
  } as Response<any>;
 },
);

export const getUserOrdersByStatus = api(
 {
  expose: true,
  auth: true,
  path: "/api/order/status",
  method: "GET",
 },
 async (params: OrderSearchByStatusQuery): Promise<Response<TOrderAndItem>> => {
  const [authdata, error] = getAuth<AuthData>();

  const result = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(
    and(
     eq(order.userId, authdata?.userID as string),
     eq(order.orderStatus, params.status ?? "pending"),
    ),
   )
   .orderBy(desc(order.createdAt));

  return {
   status: "ok",
   message: "fetched order by status successfully",
   data: {
    order: result[0].orders,
    order_items: result.filter((i) => i.orderItem).map((o) => o.orderItem),
   },
  } as Response<any>;
 },
);

export const getOrderDetails = api(
 {
  expose: true,
  auth: true,
  path: "/api/order/:orderId",
  method: "GET",
 },
 async (req: GetOrderDetailsDto): Promise<Response<TOrderAndItem>> => {
  const [authdata, error] = getAuth<AuthData>();

  const result = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(
    and(
     eq(order.id, req.orderId),
     eq(order.userId, authdata?.userID as string),
    ),
   );

  return {
   status: "ok",
   message: "fetched order data successfully",
   data: {
    order: result[0].orders,
    order_items: result.filter((i) => i.orderItem).map((o) => o.orderItem),
   },
  } as Response<any>;
 },
);

export const getMerchantOrders = api(
 {
  expose: true,
  auth: true,
  path: "/api/order/merchant",
  method: "GET",
 },
 async (
  params: OrderSearchQueryPagination,
 ): Promise<Response<TOrderAndItem>> => {
  const [authdata, error] = getAuth<AuthData>();

  const merchantId = await helper.getMerchantIdFromUser(
   authdata?.userID as string,
  );

  const limit = Math.min(Math.max(params.pageSize ?? 10, 1), 50);
  const pageNumber = Math.max(params.pageNumber ?? 1, 1);
  const offset = (pageNumber - 1) * limit;

  let fetchedOrders = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(eq(orderItem.merchantId, merchantId))
   .limit(limit)
   .offset(offset)
   .orderBy(desc(order.createdAt));

  const merchantOrders =
   fetchedOrders.map(({ orders: o, orderItem: item }) => ({
    ...item,
    order: o
     ? {
        deliveryAddress: o.deliveryAddress,
        orderStatus: o.orderStatus,
        paymentStatus: o.paymentStatus,
       }
     : null,
   })) || [];

  return {
   status: "ok",
   message: "fetched merchant orders",
   data: { merchantOrders },
  } as Response<any>;
 },
);

// export const confirmOrder = api(
//  {
//   expose: true,
//   auth: true,
//   path: "/api/order/:orderId",
//   method: "GET",
//  },
//  async (req: any) => {
//   const [authdata, error] = getAuth<AuthData>();

//   await db.select().from(order).where(eq(order.id, req.orderId));
//  },
// );

export const clearPendingOrders = api(
 {
  expose: true,
  auth: true,
  path: "/api/order",
  method: "DELETE",
 },
 async () => {
  await db
   .delete(order)
   .where(
    and(
     lt(order.createdAt, sql`now() - interval '1 month'`),
     eq(order.orderStatus, "pending"),
     eq(orderItem.orderId, order.id),
    ),
   );
 },
);

export const cancelOrder = api(
 {
  expose: true,
  auth: true,
  path: "/api/order/:orderId",
  method: "DELETE",
 },
 async (req: DeleteOrderDto) => {
  await db
   .update(order)
   .set({
    orderStatus: "cancelled",
   })
   .where(and(eq(order.id, req.orderId), ne(order.paymentStatus, "paid")));
 },
);
