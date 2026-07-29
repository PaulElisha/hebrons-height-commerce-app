/** @format */

import db from "@db/db.ts";
import { outbox } from "@schema/outbox.ts";
import { EventBus } from "@shared/event-bus/index.ts";
import type { EventContract } from "@shared/event-bus/types.ts";
import { eq, isNull } from "drizzle-orm";
import FA from "fasy";

class OutboxService {
 save = async (event: EventContract) => {
  await db.insert(outbox).values({
   eventType: event.event_type,
   payload: event.payload as Record<string, unknown>,
  });
 };

 replayUnprocessed = async (): Promise<number> => {
  const events = await db
   .select()
   .from(outbox)
   .where(isNull(outbox.processedAt))
   .orderBy(outbox.createdAt);

  await FA.concurrent.map(async (e: typeof outbox.$inferSelect) => {
   try {
    EventBus.publish({
     event_type: e.eventType as EventContract["event_type"],
     payload: e.payload as EventContract["payload"],
    });
    await db
     .update(outbox)
     .set({ processedAt: new Date() })
     .where(eq(outbox.id, e.id));
   } catch (err) {
    await db
     .update(outbox)
     .set({
      attempts: e.attempts + 1,
      lastError: err instanceof Error ? err.message : "Unknown error",
     })
     .where(eq(outbox.id, e.id));
   }
  }, events);

  return events.length;
 };
}

export default new OutboxService();
