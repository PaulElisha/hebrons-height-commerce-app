/** @format */

import { api, Query } from "encore.dev/api";
import { eq, and, or, SQL, desc, isNotNull, ne } from "drizzle-orm";

import { db } from "../../module/auth/db";
import { cart, cartItem } from "../../schema/cart";
import { getAuth } from "../../shared/get-auth";
import { AuthData, Response, TOrder } from "../../shared/types";
import { order, orderItem } from "../../schema/order";
import * as CartAPI from "../cart/routes";
import { TCartAndItem, TCartItem } from "../../shared/types";
import { TOrderAndItem } from "../../shared/types";

interface CreateOrderDto {
 deliveryAddress: Record<string, any>;
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
    } as any,
   })
   .returning();

  const itemsToInsert = ((data.data as any)?.cart_items || []).map(
   (v: TCartItem) => ({
    orderId: newOrder?.id,
    productId: v.productId,
    quantity: v.quantity,
    unitPrice: v.price,
    lineTotal: v.quantity * v.price,
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
 async () => {},
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
  await db.delete(order).where(eq(order.orderStatus, "pending"));
 },
);

export const deleteOrder = api(
 {
  expose: true,
  auth: true,
  path: "/api/order/:orderId",
  method: "DELETE",
 },
 async (req: DeleteOrderDto) => {
  await db.delete(orderItem).where(eq(orderItem.orderId, req.orderId));
 },
);
