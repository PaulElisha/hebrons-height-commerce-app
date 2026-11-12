/** @format */

import logger from "@app/logger.ts";
import OutboxService from "@module/outbox/outbox.service.ts";
import { EventBroker } from "@shared/event-bus/index.ts";

const OUTBOX_RETRY_DELAY_MS = 3_000;

const scheduleImmediateRetry = (outboxId: string, eventType: string) => {
 const timer = setTimeout(() => {
  try {
   EventBroker.publish({ event_type: eventType, payload: { outboxId } });
  } catch (err) {
   logger.error({ err, outboxId }, "Outbox immediate retry failed");
  }
 }, OUTBOX_RETRY_DELAY_MS);

 timer.unref();
};

export const consumeOutboxEvent = async <T = Record<string, unknown>>(
 cb: (payload: T) => Promise<void>,
 outboxId?: string,
) => {
 if (!outboxId) return;

 let outboxEvent: Awaited<ReturnType<typeof OutboxService.claim>>[0];

 try {
  const [claimed, err] = await OutboxService.claim(outboxId);

  if (err) {
   logger.error({ outboxId, err }, "Outbox event claim failed");
   return;
  }

  outboxEvent = claimed;
 } catch (err) {
  logger.error({ err, outboxId }, "Outbox event claim failed");
  return;
 }

 if (!outboxEvent)
  return logger.info(
   { outboxId },
   "Outbox event not found, already processed, or max attempts reached",
  );

 try {
  await cb(outboxEvent.payload as T);
  await OutboxService.update(outboxId);

  logger.info(
   { outboxId, eventType: outboxEvent.eventType },
   "Outbox event processed",
  );
 } catch (err) {
  const msg = err instanceof Error ? err?.message : String(err);

  logger.error({ err, outboxId }, "Outbox event failed");
  await OutboxService.markFailed(outboxId, msg);

  if (outboxEvent.attempts === 1)
   scheduleImmediateRetry(outboxId, outboxEvent.eventType);
 }
};
