/** @format */

import { api, Query } from "encore.dev/api";
import { eq, and, or, SQL, desc, isNotNull, ne } from "drizzle-orm";

import { db } from "../../module/auth/db";
import { cart, cartItem } from "../../schema/cart";
import { getAuth } from "../../shared/get-auth";
import { AuthData, Response, TOrder } from "../../shared/types";
import { order, orderItem } from "../../schema/order";
import * as CartService from "../cart/routes";
import { TCartAndItem, TCartItem } from "../../shared/types";
import { TOrderAndItem } from "../../shared/types";

interface CreateOrderDto {
 deliveryAddress: Record<string, any>;
}

interface GetOrderDetails {
 orderId: string;
}

interface OrderSearchByStatusQuery {
 status?: Query<string>;
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

  const data: Response<TCartAndItem> = await CartService.getUserCart();

  const [newOrder] = await db
   .insert(order)
   .values({
    userId: authdata?.userID as string,
    cartId: data.data?.cart?.id as string,
    subtotal: data.data?.cart?.subtotal as number,
    deliveryAddress: {
     label: "home",
     address: "",
     city: "",
     state: "",
     country: "",
    } as any,
   })
   .returning();

  const itemsToInsert = (data.data?.cart_items || []).map((v: TCartItem) => ({
   orderId: newOrder?.id,
   productId: v.productId,
   quantity: v.quantity,
   unitPrice: v.price,
   lineTotal: v.quantity * v.price,
  }));

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
 async (params: OrderSearchByStatusQuery): Promise<Response<TOrder>> => {
  const [authdata, error] = getAuth<AuthData>();

  const orderInStatus = await db
   .select()
   .from(order)
   .where(
    and(
     eq(order.userId, authdata?.userID as string),
     eq(order.orderStatus, params.status ?? "pending"),
    ),
   )
   .orderBy(desc(order.createdAt));

  return {
   status: "ok",
   message: "fetched orders by status",
   data: {
    orders: orderInStatus.map((o) => o),
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
 async (req: GetOrderDetails): Promise<Response<TOrderAndItem>> => {
  const [authdata, error] = getAuth<AuthData>();

  const result = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(orderItem.orderId, order.id))
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
    order_items: result?.map((o) => o.orderItem),
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
