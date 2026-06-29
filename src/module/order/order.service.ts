/** @format */

import db from "@db/db.ts";
import CartService from "@module/cart/cart.service.ts";
import { order, orderItem } from "@schema/order.ts";
import * as helper from "@shared/helper.ts";
import { Pagination } from "@shared/types.ts";
import { TCartItem } from "@module/cart/cart.controller.ts";
import { and, desc, eq, lt, ne, sql } from "drizzle-orm";
import FA from "fasy";
import { TOrder, TOrderAndItems } from "./order.controller.ts";
import HttpStatus from "@shared/enum/http.ts";
import NotFoundException from "@shared/error/not-found.ts";
import ErrorCode from "@shared/enum/error-code.ts";

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
  pagination: Pagination,
 ): Promise<TOrderAndItems> => {
  const merchantId = await helper.getMerchantIdFromUser(userId);

  const limit = Math.min(Math.max(pagination.pageSize ?? 10, 1), 50);
  const pageNumber = Math.max(pagination.pageNumber ?? 1, 1);
  const offset = (pageNumber - 1) * limit;

  const fetchedOrders = await db
   .select()
   .from(order)
   .innerJoin(orderItem, eq(order.id, orderItem.orderId))
   .where(eq(orderItem.merchantId, merchantId))
   .limit(limit)
   .offset(offset)
   .orderBy(desc(order.createdAt));

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
