/** @format */

import logger from "@app/logger.ts";
import OutboxService from "@module/outbox/outbox.service.ts";

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
 }
};
