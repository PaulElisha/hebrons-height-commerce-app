/** @format */

import logger from "@app/logger.ts";
import OutboxService from "@module/outbox/outbox.service.ts";

const MAX_OUTBOX_ATTEMPTS = 5;

export const consumeOutboxEvent = async <T = Record<string, unknown>>(
 outboxId: string | undefined,
 cb: (payload: T) => Promise<void>,
) => {
 if (!outboxId) return logger.info("Missing outbox id");

 const [outboxEvent, e] = await OutboxService.fetchById(outboxId);

 if (e || !outboxEvent) return logger.info("Event already processed");

 if (outboxEvent.attempts >= MAX_OUTBOX_ATTEMPTS)
  return logger.info("Event dead-lettered (max attempts reached)");

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
