/** @format */

import OutboxService from "@module/outbox/outbox.service.ts";
import { EventBus } from "@shared/event-bus/index.ts";
import type { EventContract } from "@shared/event-bus/types.ts";

export async function publishEvent(event: EventContract) {
 const outboxEvent = await OutboxService.save({
  event_type: event.event_type,
  payload: {
   ...event.payload,
   ...(event.userId ? { userId: event.userId } : {}),
  },
 });

 EventBus.publish({
  event_type: event.event_type,
  userId: event.userId,
  payload: { ...event.payload, outboxId: outboxEvent.id },
 });
}
