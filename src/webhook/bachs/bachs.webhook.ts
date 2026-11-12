/** @format */

import Env from "@/env.ts";
import logger from "@app/logger.ts";
import { BachsWebhookError, webhooks } from "@bachs/sdk";
import type {
 CheckoutSessionResponse,
 PaymentResponse,
 WebhookEvent,
} from "@bachs/sdk";
import HttpStatus from "@shared/enum/http.ts";
import * as APIError from "@shared/error/APIError.ts";
import { EventType } from "@shared/event-bus/index.ts";
import { publishEvent } from "@shared/event-bus/publish-event.ts";
import { findPaymentByReference } from "@shared/helper.ts";
import WebHookHandler from "@webhook/handler/payment.handler.ts";
import { Request, Response } from "express";

type BachsWebhookData = Partial<CheckoutSessionResponse> &
 Partial<PaymentResponse>;

const normalizeBachsWebhookData = (event: WebhookEvent) => {
 const data = event.data as BachsWebhookData;
 const charge = data.charge ?? undefined;

 const reference = data.checkout_id ?? data.reference ?? undefined;
 const orderId =
  (data.meta?.orderId as string | undefined) ??
  (data.metadata?.orderId as string | undefined) ??
  (charge?.meta?.orderId as string | undefined);
 const amount = Number(data.amount ?? charge?.amount ?? 0);
 const paidAt = data.completed_at
  ? new Date(data.completed_at)
  : new Date(event.created_at);

 return { reference, orderId, amount, paidAt };
};

export const bachsWebhookHandler = async (req: Request, res: Response) => {
 //  const rawBody = JSON.parse(req.body);

 let event: WebhookEvent;

 try {
  event = webhooks.constructEvent(
   req.rawBody,
   req.headers,
   Env.BACHS_WEBHOOK_SECRET,
  );
 } catch (error) {
  if (error instanceof BachsWebhookError) {
   return res
    .status(HttpStatus.BAD_REQUEST)
    .json({ received: false, message: "Invalid Bachs signature" });
  }

  throw error;
 }

 try {
  switch (event.type) {
   case "checkout.completed":
   case "collection.succeeded": {
    const { reference, orderId, amount, paidAt } =
     normalizeBachsWebhookData(event);

    if (!reference) throw APIError.badRequest("Missing checkout reference");

    const [, err] = await WebHookHandler.handleBachsPaymentVerified(
     {
      event: event.type,
      reference,
      amount,
      paid_at: paidAt,
     },
     orderId ?? "",
    );

    if (err) throw err;

    return res.status(HttpStatus.OK).json({ received: true });
   }

   case "checkout.expired": {
    const { reference } = normalizeBachsWebhookData(event);

    if (!reference) throw APIError.badRequest("Missing checkout reference");

    const [paymentRecord, err] = await findPaymentByReference(reference);

    if (err || !paymentRecord) throw APIError.notFound("Payment not found");

    const [failed, failErr] = await WebHookHandler.handlePaymentFailure(
     paymentRecord.id,
    );

    if (failErr) throw failErr;

    if (failed?.payment.status === "failed") {
     await publishEvent({
      event_type: EventType.PAYMENT_FAILED,
      payload: {
       userId: paymentRecord.userId,
       orderId: paymentRecord.orderId,
       reason: "Checkout session expired",
       paymentId: paymentRecord.id,
      },
     });
    }

    return res.status(HttpStatus.OK).json({ received: true });
   }

   default:
    logger.info({ eventType: event.type }, "[...Unhandled Bachs event type]");
    return res.status(HttpStatus.OK).json({ received: true });
  }
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  logger.error({ err: message, eventType: event.type }, "[...Bachs webhook]");

  return res
   .status(HttpStatus.INTERNAL_SERVER_ERROR)
   .send(`Webhook Error ${message}`);
 }
};
