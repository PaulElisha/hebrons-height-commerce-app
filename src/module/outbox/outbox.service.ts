/** @format */

import logger from "@app/logger.ts";
import db from "@db/db.ts";
import { outbox } from "@schema/outbox.ts";
import AppError from "@shared/error/app-error.ts";
import { EventBus } from "@shared/event-bus/index.ts";
import type { EventContract } from "@shared/event-bus/types.ts";
import { Result } from "@shared/types.ts";
import { and, eq, isNull, sql } from "drizzle-orm";
import FA from "fasy";

export const consumeOutboxEvent = async <T = Record<string, unknown>>(
 outboxId: string,
 cb: (payload: T) => Promise<void>,
) => {
 const [event, e] = await OutboxService.fetchById(outboxId);

 if (e || !event || typeof event.processedAt === null)
  return logger.info("Event already processed");

 try {
  await cb(event.payload as T);
  await OutboxService.update(outboxId);

  logger.info(
   { outboxId, eventType: event.eventType },
   "Outbox event processed",
  );
 } catch (err) {
  const msg = err instanceof Error ? err.message : "Unknown error";
  logger.error({ err, outboxId }, "Outbox event failed");
  await OutboxService.markFailed(outboxId, msg);
 }
};

class OutboxService {
 static async save(event: EventContract): Promise<typeof outbox.$inferSelect> {
  const [row] = await db
   .insert(outbox)
   .values({
    eventType: event.event_type,
    payload: event.payload as Record<string, unknown>,
   })
   .returning();
  return row;
 }

 static async fetchById(
  outboxId: string,
 ): Promise<Result<typeof outbox.$inferSelect, AppError>> {
  const [row] = await db
   .select()
   .from(outbox)
   .where(eq(outbox.id, outboxId))
   .limit(1);

  if (!row) [null, null];
  return [row, null];
 }

 static async update(outboxId: string): Promise<void> {
  await db
   .update(outbox)
   .set({ processedAt: new Date() })
   .where(and(eq(outbox.id, outboxId), isNull(outbox.processedAt)));
 }

 static async markFailed(outboxId: string, error: string): Promise<void> {
  await db
   .update(outbox)
   .set({
    attempts: sql`${outbox.attempts} + 1`,
    lastError: error,
   })
   .where(and(eq(outbox.id, outboxId), isNull(outbox.processedAt)));
 }

 static async replayUnprocessed(): Promise<number> {
  const events = await db
   .select()
   .from(outbox)
   .where(isNull(outbox.processedAt))
   .orderBy(outbox.createdAt);

  await FA.concurrent.map(async (e: typeof outbox.$inferSelect) => {
   try {
    EventBus.publish({
     event_type: e.eventType as EventContract["event_type"],
     payload: { outboxId: e.id },
    });
   } catch (err) {
    logger.error({ err, outboxId: e.id }, "Failed to re-publish outbox event");
   }
  }, events);

  return events.length;
 }
}

export default OutboxService;
