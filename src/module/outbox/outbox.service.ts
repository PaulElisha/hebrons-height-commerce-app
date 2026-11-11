/** @format */

import logger from "@app/logger.ts";
import db from "@db/db.ts";
import { outbox } from "@db/schema/outbox.ts";
import { EventBroker } from "@shared/event-bus/index.ts";
import type { EventContract } from "@shared/event-bus/types.ts";
import { Result } from "@shared/types.ts";
import { and, eq, isNull, lt, sql } from "drizzle-orm";

const MAX_OUTBOX_ATTEMPTS = 5;

class OutboxService {
 static async save(event: EventContract): Promise<typeof outbox.$inferSelect> {
  const [row] = await db
   .insert(outbox)
   .values({
    eventType: event.event_type,
    payload: event.payload,
   })
   .returning();
  return row;
 }

 static async fetchById(
  outboxId: string,
 ): Promise<Result<typeof outbox.$inferSelect>> {
  const [row] = await db
   .select()
   .from(outbox)
   .where(eq(outbox.id, outboxId))
   .limit(1);

  if (!row) return [null, null];
  return [row, null];
 }

 static async claim(
  outboxId: string,
 ): Promise<Result<typeof outbox.$inferSelect>> {
  const [row] = await db
   .update(outbox)
   .set({
    attempts: sql`${outbox.attempts} + 1`,
   })
   .where(
    and(
     eq(outbox.id, outboxId),
     isNull(outbox.processedAt),
     lt(outbox.attempts, MAX_OUTBOX_ATTEMPTS),
    ),
   )
   .returning();

  if (!row) return [null, null];

  return [row, null];
 }

 static async update(outboxId: string): Promise<void> {
  await db
   .update(outbox)
   .set({
    processedAt: new Date(),
   })
   .where(and(eq(outbox.id, outboxId), isNull(outbox.processedAt)));
 }

 static async markFailed(outboxId: string, error: string): Promise<void> {
  const [updated] = await db
   .update(outbox)
   .set({
    lastError: error,
   })
   .where(and(eq(outbox.id, outboxId), isNull(outbox.processedAt)))
   .returning({ attempts: outbox.attempts });

  if (updated && Number(updated.attempts) >= MAX_OUTBOX_ATTEMPTS) {
   await db
    .update(outbox)
    .set({ processedAt: new Date() })
    .where(eq(outbox.id, outboxId));

   logger.warn(
    { outboxId, error },
    "Outbox event dead-lettered after max attempts",
   );
  }
 }

 static async replayUnprocessed(): Promise<number> {
  const events = await db
   .select()
   .from(outbox)
   .where(
    and(isNull(outbox.processedAt), lt(outbox.attempts, MAX_OUTBOX_ATTEMPTS)),
   )
   .orderBy(outbox.createdAt);

  for (const e of events) {
   try {
    EventBroker.publish({
     event_type: e.eventType as EventContract["event_type"],
     payload: { outboxId: e.id },
    });
   } catch (err) {
    logger.error({ err, outboxId: e.id }, "Failed to re-publish outbox event");
   }

   await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return events.length;
 }
}

export default OutboxService;
