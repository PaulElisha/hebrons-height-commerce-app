/** @format */

import db from "@db/db.ts";
import CartService from "@module/cart/cart.service.ts";
import { order, orderItem } from "@schema/order.ts";
import * as helper from "@shared/helper.ts";
import {
 Pagination,
 TCartItem,
 TOrder,
 TOrderAndItems,
} from "@shared/types.ts";
import { and, count, desc, eq, isNotNull, lt, ne, SQL, sql } from "drizzle-orm";
import FA from "fasy";

interface CreateOrderDto {
 deliveryAddress: Record<string, string>;
}

class OrderService {
 placeOrder = async (
  userId: string,
  cartId: string,
  body: CreateOrderDto,
 ): Promise<string> => {
  const data = await CartService.getUserCart(userId, cartId);
  const [newOrder] = await db
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
   .returning();

  const itemsToInsert = await FA.concurrent.map(async (v: TCartItem) => {
   const merchantId = await helper.getMerchantIdFromProductId(v.productId);

   return {
    orderId: newOrder?.id,
    productId: v.productId,
    merchantId,
    quantity: v.quantity,
    unitPrice: v.price,
    lineTotal: v.quantity * v.price,
   };
  }, data?.cart_items || []);

  if (itemsToInsert.length > 0) {
   await db.insert(orderItem).values(itemsToInsert);
  }

  return newOrder.id;
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
    and(eq(order.userId, userId), eq(order.orderStatus, status ?? "pending")),
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

  const merchantOrders =
   fetchedOrders.map(({ orders: o, orderItem: item }) => ({
    orderItem: item,
    order: o,
   })) || [];

  return {
   order: merchantOrders[0].order,
   order_items: merchantOrders
    .filter((i) => i.orderItem)
    .map((o) => o.orderItem),
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
  const [cancelledOrder] = await db
   .update(order)
   .set({
    orderStatus: "cancelled",
    paymentStatus: "cancelled",
   })
   .where(and(eq(order.id, orderId), ne(order.paymentStatus, "paid")))
   .returning();

  return cancelledOrder;
 };
}

export default new OrderService();
