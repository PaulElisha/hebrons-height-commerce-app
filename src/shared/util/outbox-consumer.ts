/** @format */

import logger from "@app/logger.ts";
import OutboxService from "@module/outbox/outbox.service.ts";

const MAX_OUTBOX_ATTEMPTS = 5;

export const consumeOutboxEvent = async <T = Record<string, unknown>>(
 cb: (payload: T) => Promise<void>,
 outboxId?: string,
) => {
 if (!outboxId) return;

 const [outboxEvent, err] = await OutboxService.fetchById(outboxId);

 if (err || !outboxEvent) {
  logger.info({ outboxId, err }, "Outbox event not found or already processed");
  return;
 }

 if (outboxEvent.attempts >= MAX_OUTBOX_ATTEMPTS)
  return logger.info(
   { outboxId },
   "Outbox event dead-lettered (max attempts reached)",
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
